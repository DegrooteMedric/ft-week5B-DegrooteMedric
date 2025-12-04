// verifier.js
// Verifier (werkgever): controleert diploma-credentials (VC JWT) via CLI of HTTP-API.

const fs = require("fs");
const path = require("path");
const express = require("express");
const { verifyJWT } = require("did-jwt");

function loadConfig() {
  const tokenConfigPath = path.join(__dirname, "token", "config.json");
  const exampleConfigPath = path.join(__dirname, "config.example.json");

  if (fs.existsSync(tokenConfigPath)) {
    return JSON.parse(fs.readFileSync(tokenConfigPath, "utf8"));
  }

  return JSON.parse(fs.readFileSync(exampleConfigPath, "utf8"));
}

async function verifyDiplomaVC(jwt) {
  const config = loadConfig();

  const trustedIssuers = config.trustedIssuers || [];

  const { payload, issuer } = await verifyJWT(jwt, {
    resolver: {
      resolve: async (did) => {
        // Minimalistische DID-resolver voor demo: haalt public key uit config
        if (did === config.issuerDid) {
          return {
            didDocument: {
              id: did,
              publicKey: [
                {
                  id: `${did}#owner`,
                  type: "Secp256k1VerificationKey2018",
                  controller: did,
                  publicKeyHex: config.issuerPublicKey.replace(/^0x/, "")
                }
              ]
            }
          };
        }
        throw new Error(`Onbekende DID: ${did}`);
      }
    },
    audience: undefined
  });

  // Authenticiteit: issuer moet vertrouwd zijn
  if (!trustedIssuers.includes(issuer)) {
    throw new Error(`Issuer ${issuer} is niet vertrouwd`);
  }

  // Vervaldatum: check exp claim
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error("Credential is verlopen");
  }

  return payload;
}

function startServer() {
  const app = express();
  const PORT = 3001;

  // CORS zodat lokale HTML (file://) kan praten met de verifier
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json());

  app.post("/verify", async (req, res) => {
    const { jwt, vcJwt, token } = req.body || {};
    const incoming = jwt || vcJwt || token;

    if (!incoming) {
      return res
        .status(400)
        .json({ valid: false, error: "Body moet een JWT bevatten (jwt/vcJwt/token)" });
    }

    try {
      const payload = await verifyDiplomaVC(incoming);
      res.json({ valid: true, payload });
    } catch (err) {
      res
        .status(400)
        .json({ valid: false, error: err.message || "Onbekende verificatiefout" });
    }
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", role: "verifier" });
  });

  app.listen(PORT, () => {
    console.log(`Verifier-server draait op http://localhost:${PORT}`);
  });
}

async function main() {
  // CLI-modus: node verifier.js "<JWT>" of server-modus: node verifier.js serve
  const arg = process.argv[2];

  if (arg === "serve") {
    startServer();
    return;
  }

  const jwt = arg;
  if (!jwt) {
    console.error('Gebruik: node verifier.js "<VC_JWT_STRING>" of `node verifier.js serve`');
    process.exit(1);
  }

  try {
    const payload = await verifyDiplomaVC(jwt);
    console.log("=== VC geldig – Toegang verleend ===");
    console.log("Payload:", JSON.stringify(payload, null, 2));
  } catch (err) {
    console.error("=== VC ongeldig – Toegang geweigerd ===");
    console.error(err.message || err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { verifyDiplomaVC, startServer };


