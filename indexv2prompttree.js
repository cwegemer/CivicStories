require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const config = {
  endpoint: process.env.API_ENDPOINT,
  apiKey: process.env.API_KEY,
};

const readStoryOutline = (affiliation) => {
  const fileMap = {
    democrat: 'democrat.txt',
    republican: 'republican.txt',
    independent: 'independent.txt'
  };
  const filePath = fileMap[affiliation.toLowerCase()];

  if (!filePath) {
    throw new Error('Invalid affiliation');
  }

  return fs.readFileSync(filePath, 'utf8');
};

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
    { role: 'system', content: 'You are an empathetic and charismatic storyteller. Engage in a Q&A session, then tell the listener you will tell them a story about your recent experience based on the outline provided.' }
  ];

  let stage = 0;

  const askQuestion = async (question) => {
    console.log('ChatGPT:', question);
    messages.push({ role: 'assistant', content: question });

    rl.question('You: ', async (answer) => {
      if (answer.toLowerCase() === 'exit') {
        console.log('Exiting chat...');
        rl.close();
        return;
      }

      messages.push({ role: 'user', content: answer });

      const response = await sendMessage(messages);

      if (response && response.choices && response.choices.length > 0) {
        const chatResponse = response.choices[0].message.content;
        console.log('ChatGPT:', chatResponse);
        messages.push({ role: 'assistant', content: chatResponse });

        if (stage === 0) {
          stage++;
          askQuestion("My name is Christian. What's your name?");
        } else if (stage === 1) {
          if (answer.trim() !== '') {
            stage++;
            askQuestion("What's your political party affiliation? (democrat, republican, independent)");
          } else {
            askQuestion("Please tell me your name.");
          }
        } else if (stage === 2) {
          if (['democrat', 'republican', 'independent'].includes(answer.trim().toLowerCase())) {
            const userAffiliation = answer.trim().toLowerCase();
            const storyOutline = readStoryOutline(userAffiliation);
            messages.push({ role: 'system', content: `Here is the outline of the story: ${storyOutline}` });
            messages.push({ role: 'assistant', content: `I also agree with the ${userAffiliation} party.` });
            messages.push({ role: 'assistant', content: `Now, let me tell you a story about my recent experience based on your provided outline.` });

            const storyResponse = await sendMessage(messages);

            if (storyResponse && storyResponse.choices && storyResponse.choices.length > 0) {
              const storyChatResponse = storyResponse.choices[0].message.content;
              console.log('ChatGPT:', storyChatResponse);
              messages.push({ role: 'assistant', content: storyChatResponse });
            } else {
              console.log('No response received');
            }
          } else {
            askQuestion("Please tell me your political party affiliation. (democrat, republican, independent)");
          }
        }
      } else {
        console.log('No response received');
      }
    });
  };

  // Start the conversation with the initial question
  askQuestion("Hi there! How's your day going?");
};

startChat();
