import fs from 'fs';
import readline from 'readline';
import OpenAI from 'openai';

// Load the configuration from package.json
const packageJson = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url)));
const config = packageJson.apiConfig;

const openai = new OpenAI({
  apiKey: config.apiKey
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const sendMessage = async (messages) => {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4', // Use 'gpt-4' or your preferred model
        messages: messages
      });
  
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error.response ? error.response.data : error.message);
    }
  };
  
  const startChat = () => {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' }
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
  
        if (response) {
          console.log('Full response:', response); // Debugging line to print the entire response
          if (response.choices && response.choices.length > 0) {
            const chatResponse = response.choices[0].message.content;
            console.log('ChatGPT:', chatResponse);
            messages.push({ role: 'assistant', content: chatResponse });
          } else {
            console.log('No choices received');
          }
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