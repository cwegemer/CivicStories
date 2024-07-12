const axios = require('axios');
const fs = require('fs');
const readline = require('readline');

// Load the configuration from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const config = packageJson.apiConfig;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const sendMessage = async (messages) => {
  try {
    const response = await axios.post(
      config.endpoint,
      {
        model: 'gpt-4', // Use 'gpt-4' or your preferred model
        messages: messages
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error sending message:', error.response ? error.response.data : error.message);
  }
};

const startChat = () => {
  const messages = [
    { role: 'system', content: 'You are an empathetic and charismatic storyteller.' }
  ];

  const askQuestion = () => {
    rl.question('You: ', async (message) => {
      if (message.toLowerCase() === 'exit') {
        console.log('Exiting chat...');
        rl.close();
        return;
      }

      messages.push({ role: 'user', content: message });

      const response = await sendMessage(messages);

      if (response && response.choices && response.choices.length > 0) {
        const chatResponse = response.choices[0].message.content;
        console.log('ChatGPT:', chatResponse);
        messages.push({ role: 'assistant', content: chatResponse });
      } else {
        console.log('No response received');
      }

      askQuestion();
    });
  };

  console.log('Start chatting with ChatGPT (type "exit" to quit):');
  askQuestion();
};

startChat();
