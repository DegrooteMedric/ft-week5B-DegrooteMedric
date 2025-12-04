// issuer.js
// Issuer (school): maakt en signeert diploma-credentials via een HTTP-API.

const fs = require("fs");
const path = require("path");
const express = require("express");
const { createJWT, ES256KSigner } = require("did-jwt");

function loadConfig() {
  const tokenConfigPath = path.join(__dirname, "token", "config.json");
  const exampleConfigPath = path.join(__dirname, "config.example.json");

  if (fs.existsSync(tokenConfigPath)) {
    return JSON.parse(fs.readFileSync(tokenConfigPath, "utf8"));
  }

  return JSON.parse(fs.readFileSync(exampleConfigPath, "utf8"));
}

async function issueDiplomaVC({ name, opleiding, afstudeerdatum }) {
  const config = loadConfig();

  const issuerDid = config.issuerDid;
  const privKeyHex = config.issuerPrivateKey.replace(/^0x/, "");

  const signer = ES256KSigner(Buffer.from(privKeyHex, "hex"));

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60 * 24 * 365; // 1 jaar geldig

  const payload = {
    iss: issuerDid,
    sub: `did:example:${name.toLowerCase().replace(/\s+/g, "-")}`,
    iat: now,
    exp,
    vc: {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiableCredential", "DiplomaCredential"],
      credentialSubject: {
        name,
        opleiding,
        afstudeerdatum,
      },
    },
  };

  const jwt = await createJWT(payload, {
    issuer: issuerDid,
    signer,
    alg: "ES256K",
  });

  return jwt;
}

function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS zodat we vanuit lokale HTML (file://) kunnen requesten
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json());

  app.post("/issue", async (req, res) => {
    const { name, opleiding, afstudeerdatum } = req.body || {};

    if (!name || !opleiding || !afstudeerdatum) {
      return res
        .status(400)
        .json({ error: "name, opleiding en afstudeerdatum zijn verplicht" });
    }

    try {
      const vcJwt = await issueDiplomaVC({ name, opleiding, afstudeerdatum });
      res.json({ vcJwt });
    } catch (err) {
      console.error("Fout bij uitgifte VC:", err);
      res.status(500).json({ error: "Kon credential niet genereren" });
    }
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", role: "issuer" });
  });

  app.listen(PORT, () => {
    console.log(`Issuer-server draait op http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { issueDiplomaVC };
