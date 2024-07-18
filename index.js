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

const readStoryOutline = (userAffiliation) => {
  const fileMap = {
    democrat: 'democrat.txt',
    republican: 'republican.txt',
    independent: 'independent.txt'
  };
  const filePath = fileMap[userAffiliation.toLowerCase()];

  if (!filePath) {
    throw new Error('Invalid affiliation');
  }

  return fs.readFileSync(filePath, 'utf8');
};

const determineAffiliation = (response) => {
  const lowerCaseResponse = response.toLowerCase();
  const liberalKeywords = ['liberal', 'progressive', 'left', 'democrat'];
  const conservativeKeywords = ['conservative', 'right', 'republican'];
  const independentKeywords = ['independent', 'moderate', 'centrist'];

  for (const keyword of liberalKeywords) {
    if (lowerCaseResponse.includes(keyword)) {
      return 'democrat';
    }
  }
  for (const keyword of conservativeKeywords) {
    if (lowerCaseResponse.includes(keyword)) {
      return 'republican';
    }
  }
  for (const keyword of independentKeywords) {
    if (lowerCaseResponse.includes(keyword)) {
      return 'independent';
    }
  }
  return 'independent'; // Default to independent if no strong keywords are found
};

const isAffirmative = (response) => {
  const affirmativeKeywords = ['yes', 'sure', 'okay', 'ok', 'of course', 'definitely', 'absolutely', 'certainly'];
  const lowerCaseResponse = response.toLowerCase();
  return affirmativeKeywords.some(keyword => lowerCaseResponse.includes(keyword));
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

const startChat = async () => {
  const messages = [
    { role: 'system', content: 'You are an empathetic and charismatic college student named Christian. Engage in a friendly Q&A session to get to know the user, try to obtain the user\'s name and political affiliation naturally, then you will ask permission for you to share a political story.' }
  ];

  let userName = '';
  let userAffiliation = '';
  let nameProvided = false;
  let affiliationProvided = false;
  let permissionProvided = false;
  let storyTold = false;

  const initialMessage = "Hi there! How's your day going?";
  console.log('ChatGPT:', initialMessage);
  messages.push({ role: 'assistant', content: initialMessage });

  const askForName = async () => {
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

        // Prompt specifically for the user's name if it has not been provided
        if (!nameProvided) {
          messages.push({ role: 'assistant', content: "By the way, I didn't catch your name. What should I call you?" });
          askForName();
        } else {
          askForAffiliation();
        }
      } else {
        console.log('No response received');
      }
    });
  };

  const askForAffiliation = async () => {
    if (!nameProvided) {
      askForName();
      return;
    }
    console.log('THE CODE NEVER GETS THIS FAR!!!! The bot only relies on the general system command, it never executes askForAffiliation or askForStoryPermission or proceedToStory!!!!');
    rl.question('You: ', async (answer) => {
      if (answer.toLowerCase() === 'exit') {
        console.log('Exiting chat...');
        rl.close();
        return;
      }

      messages.push({ role: 'user', content: answer });

      if (!affiliationProvided) {
        userAffiliation = determineAffiliation(answer);
        affiliationProvided = true;
        messages.push({ role: 'system', content: `If it is useful in your conversation, the user's name is ${userName} and their political affiliation is ${userAffiliation}.` });
        askForStoryPermission(); // Move to the next step to ask for story permission
      } else {
        askForStoryPermission();
      }

      const response = await sendMessage(messages);

      if (response && response.choices && response.choices.length > 0) {
        const chatResponse = response.choices[0].message.content;
        console.log('ChatGPT:', chatResponse);
        messages.push({ role: 'assistant', content: chatResponse });

        // Proceed to ask for story permission if affiliation is determined
        if (affiliationProvided) {
          askForStoryPermission();
        }
      } else {
        console.log('No response received');
      }
    });
  };

  const askForStoryPermission = async () => {
    if (!affiliationProvided) {
      askForAffiliation();
      return;
    }

    messages.push({ role: 'assistant', content: `I would love to tell you a story about my recent experience. Would you like to listen?` });
    console.log('ChatGPT: I would love to tell you a story about my recent experience. Would you like to listen?');
    rl.question('You: ', async (userResponse) => {
      messages.push({ role: 'user', content: userResponse });

      if (isAffirmative(userResponse)) {
        permissionProvided = true;
        proceedToStory();
      } else {
        console.log('ChatGPT: No problem! If you change your mind, just let me know.');
        messages.push({ role: 'assistant', content: 'No problem! If you change your mind, just let me know.' });
        rl.close();
      }
    });
  };

  const proceedToStory = async () => {
    if (nameProvided && affiliationProvided && permissionProvided && !storyTold) {
      const storyOutline = readStoryOutline(userAffiliation);
      messages.push({ role: 'system', content: `Here is the outline of the story: ${storyOutline}. Use this outline to tell the story. Do not tell the user that you obtained the story from this outline.` });
      messages.push({ role: 'assistant', content: `Great! Let me tell you my story.` });

      const storyResponse = await sendMessage(messages);

      if (storyResponse && storyResponse.choices && storyResponse.choices.length > 0) {
        const storyChatResponse = storyResponse.choices[0].message.content;
        console.log('ChatGPT:', storyChatResponse);
        messages.push({ role: 'assistant', content: storyChatResponse });
        storyTold = true;
        console.log('ChatGPT: That\'s the end of my story. Did you resonate with any parts of my story?');
        messages.push({ role: 'assistant', content: 'That\'s the end of my story. Did you resonate with any parts of my story?' });

        // Provide an opportunity for the user to respond
        rl.question('You: ', async (userFeedback) => {
          messages.push({ role: 'user', content: userFeedback });
          const feedbackResponse = await sendMessage(messages);
          if (feedbackResponse && feedbackResponse.choices && feedbackResponse.choices.length > 0) {
            const feedbackChatResponse = feedbackResponse.choices[0].message.content;
            console.log('ChatGPT:', feedbackChatResponse);
          } else {
            console.log('No response received');
          }
          rl.close();
        });
      } else {
        console.log('No response received');
      }
    }
  };

  askForName();
};

startChat();
