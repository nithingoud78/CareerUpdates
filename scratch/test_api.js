async function testApi() {
  const url = 'http://localhost:8081/_serverFn/eyJmaWxlIjoiL3NyYy9saWIvcGF5bWVudHMuZnVuY3Rpb25zLnRzP3Rzcy1zZXJ2ZXJmbi1zcGxpdCIsImV4cG9ydCI6ImNyZWF0ZUNoZWNrb3V0T3JkZXJfY3JlYXRlU2VydmVyRm5faGFuZGxlciJ9';
  
  const payload = {
    data: {
      productSlug: "clean-professional-resume",
      customer: {
        email: "test@example.com",
        fullName: "Test User",
        countryCode: "+91",
        phone: "9876543210"
      }
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log("Status:", response.status);
    console.log("Body:", await response.text());
  } catch (err) {
    console.error("Fetch error:", err);
  }
}
testApi();
