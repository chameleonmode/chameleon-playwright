export default async function ask(input: string): Promise<string> {
  console.log(`Post Title: ${input}`);

  // Here you would typically call your AI/LLM endpoint with both the input and comSearch parameters
  // For now, we'll keep the readline interface but enhance it to show the context
  
  // Create a new readline interface for this specific prompt
  const rl = (await import("node:readline")).createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Return a promise that resolves when the user enters a response
  return new Promise<string>((resolve) => {
    rl.question(`Generate a comment for post "${input}" ":\n> `, async (answer) => {
      if (!answer) {
        answer = `Interesting post about! Thanks for sharing.`;
      }
      rl.close();
      const result = await callApi(answer);
      resolve(result);
    });
  });
}


async function callApi(input: string): Promise<string> {
  const apiUrl = 'https://chameleon-ws.onrender.com/air/ask/7?feature=reddit';

  const requestBody = {
    background: "relatable",
    scenario: { keyword: input }
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from API. Status: ${response.status}`);
    }

    const apiResponse = await response.json();

    return apiResponse?.payload?.response || 'No content generated from API.';
  } catch (error) {
    console.error('Error calling the API:', error);
    return 'Failed to generate content.';
  }
}