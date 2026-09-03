import fs from 'fs';

async function run() {
  const fileContent = fs.readFileSync('test_long.txt');
  const blob = new Blob([fileContent], { type: 'text/plain' });
  const formData = new FormData();
  formData.append('file', blob, 'test_long.txt');

  const payload = [
    {
      data: formData,
    }
  ];

  try {
    const res = await fetch('http://localhost:4173/_server/?_serverFnId=extractResumeText&_serverFnName=extractResumeText', {
      method: 'POST',
      body: formData, // Wait, tanstack start might expect a specific format
    });
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", text);
  } catch (err) {
    console.error("ERROR:", err);
  }
}
run();
