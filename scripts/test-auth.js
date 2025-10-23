#!/usr/bin/env node
/* Minimal smoke test: POST form data to the sign-up and sign-in routes to ensure
   session signing works (no Zero-length key error). This expects the dev server
   to be running at http://localhost:3000
*/
import http from "node:http";
import { URLSearchParams } from "node:url";

function postForm(baseUrl, path, data) {
  const url = new URL(path, baseUrl);
  const body = new URLSearchParams(data).toString();
  const opts = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(body),
    },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(url, opts, (res) => {
      let chunks = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (chunks += c));
      res.on("end", () => resolve({ status: res.statusCode, text: chunks }));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log("Testing sign-up...");
  const email = `test+${Date.now()}@example.com`;
  const base = process.env.BASE_URL || "http://localhost:3000";
  const signUp = await postForm(base, "/sign-up", {
    email,
    password: "TestPassw0rd!",
  });
  console.log("Sign-up status", signUp.status);
  console.log(signUp.text.slice(0, 500));

  console.log("Testing sign-in...");
  const signIn = await postForm(base, "/sign-in", {
    email,
    password: "TestPassw0rd!",
  });
  console.log("Sign-in status", signIn.status);
  console.log(signIn.text.slice(0, 500));
}

try {
  await run();
} catch (err) {
  console.error(err);
  process.exit(1);
}
