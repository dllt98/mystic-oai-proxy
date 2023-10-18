import BodyParser from "body-parser";

const bodyParseJson = BodyParser.json({
  limit: "100mb",
});

export const toBuffer = (object) => Buffer.from(JSON.stringify(object));

export const jsonParse = (req, res) =>
  new Promise((resolve, reject) => {
    bodyParseJson(req, res, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

export const formatStoppingStrings = ({ user, assistant, stoppingStrings }) =>
  stoppingStrings.map((v) =>
    v.replaceAll("{{user}}", user).replaceAll("{{char}}", assistant)
  );

export const findStoppingStringPosition = (stoppingStrings, text) => {
  const positions =
    stoppingStrings && stoppingStrings.length
      ? stoppingStrings.map((v) => text.indexOf(v)).filter((v) => v !== -1)
      : [];

  if (!positions.length) {
    return -1;
  }

  return Math.min(...positions);
};

export const truncateGeneratedText = (stoppingStrings, text, config) => {
  text = text.trimRight();

  let pos = findStoppingStringPosition(stoppingStrings, text);
  if (pos !== -1) {
    console.log("[ TRUNCATED ]:", text.substring(pos));
    text = text.substring(0, pos).trimRight();
  }

  if (config.dropUnfinishedSentences) {
    const endsInLetter = text.match(/[a-zA-Z0-9]$/);
    if (endsInLetter) {
      const punctuation = [...`.?!;)]>"”*`];
      pos = Math.max(...punctuation.map((v) => text.lastIndexOf(v)));
      if (pos > 5) {
        console.log("[ TRUNCATED ]:", text.substring(pos + 1));
        text = text.substring(0, pos + 1);
      }
    }
  }

  return text;
};

export const replaceTemplates = (text, config) =>
  (text || "")
    .replaceAll("{{impersonationPrompt}}", config.impersonationPrompt)
    .replaceAll("{{jailbreak}}", config.jailbreak)
    .replaceAll("{{user}}", config.user)
    .replaceAll("{{char}}", config.assistant);

export const popLastChatMessages = (prompt, count) => {
  const messages = [];
  let chatMsgCount = 0;

  for (let i = prompt.length - 1; i >= 0 && chatMsgCount < count; i--) {
    const msg = prompt[i];

    if (
      msg.metadata?.type === "user-msg" ||
      msg.metadata?.type === "assistant-msg"
    ) {
      messages.push(msg);
      prompt.splice(i, 1);
      chatMsgCount += 1;
    } else if (msg.metadata?.type === "new-conversation") {
      break;
    } else {
      messages.push(msg);
      prompt.splice(i, 1);
    }
  }

  return messages.reverse();
};

export const popLastAssistantMessage = (prompt) => {
  const index = prompt.findLastIndex(
    (v) => v.metadata?.type === "assistant-msg"
  );
  const msg = prompt[index];
  prompt.splice(index, 1);
  return msg;
};

export const getLastChatMessage = (prompt) =>
  prompt.findLast(
    (msg) =>
      msg.metadata?.type === "user-msg" ||
      msg.metadata?.type === "assistant-msg"
  );

export const limitMessagesInContext = (prompt, maxLength) => {
  const finalPrompt = [];

  const maxSize = 4098 - maxLength - 1;

  const fixedSize = prompt
    .filter((v) => !v.prunable)
    .reduce((acum, v) => acum + v.tokenCount, 0);

  let currentSize = fixedSize;
  let tryToFitMore = true;

  for (let i = prompt.length - 1; i >= 0; i--) {
    const currentMessage = prompt[i];
    const prevMessage = finalPrompt[finalPrompt.length - 1];

    if (!currentMessage.prunable) {
      const tmp = ["new-example-dialogue", "new-conversation"];
      if (
        (tmp.indexOf(currentMessage.metadata?.type) !== -1 &&
          tmp.indexOf(prevMessage?.metadata?.type) !== -1) ||
        (currentMessage.type === "new-conversation" &&
          prevMessage?.type === "new-conversation")
      ) {
        // TODO: it doesn't try to fit more messages after changing this
        // TODO: maybe do another loop and add an index to sort the messages
        currentSize -= prompt[i].tokenCount;
      } else {
        finalPrompt.push(prompt[i]);
      }
    } else if (tryToFitMore) {
      if (currentSize + prompt[i].tokenCount <= maxSize) {
        finalPrompt.push(prompt[i]);
        currentSize += prompt[i].tokenCount;
      } else {
        tryToFitMore = false;
      }
    }
  }

  finalPrompt.reverse();

  return finalPrompt;
};

export const cleanWhitespaceInFinalPrompt = (text) => {
  return text.replace(/  +/g, " ").replace(/\n+/g, "\n");
};
