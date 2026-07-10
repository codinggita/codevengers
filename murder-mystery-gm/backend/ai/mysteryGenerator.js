import { generateCompletion } from './llmClient.js';

const KHOON_KI_BARAAT_EXAMPLE = `{
  "case_id": "case_07_khoon_ki_baraat",
  "case_title": "Khoon Ki Baraat",
  "setting": "Rathore Haveli, Udaipur — sangeet night, monsoon storm, power cut, roads flooded",
  "victim": {
    "name": "Raghubir Singh Rathore",
    "age": 58,
    "relation_to_group": "Father of the groom, owner of the haveli",
    "cause_of_death_public_knowledge": "Found stabbed in his locked daftar (private office) after the blackout. Cause of death not yet confirmed to guests."
  },
  "player_count": 5,
  "players": [
    {
      "player_slot": 1,
      "character_name": "Kavita Rathore",
      "is_murderer": true,
      "public_bio": "Raghubir's sister-in-law, married to his younger brother Arjun for 22 years. Sharp, composed, seen by the extended family as 'the sensible one' who keeps the peace.",
      "private_bio": "You forged the signature on the land deal papers twenty years ago, not Arjun — but Arjun took the blame publicly to protect you, and has quietly resented it ever since. That afternoon, Raghubir told you privately that he intended to finally reveal the truth about the forgery at tomorrow's reception, to 'clear his conscience.'",
      "personal_objective": "Survive the night without being found out. Your son's engagement to a prominent political family depends on the Rathore name staying spotless. If pressed, deflect suspicion toward Arjun or Aditya — both already look more guilty than you on the surface.",
      "hidden_information": [
        "You still have a spare key to the daftar, given to you years ago and never returned.",
        "You know Raghubir planned to expose the forgery publicly tomorrow."
      ],
      "secrets": [
        { "content": "You, not Arjun, forged the land deal signature twenty years ago.", "must_not_reveal_unprompted": true },
        { "content": "You left the sangeet at 9:40 PM claiming a headache, and did not return to your room.", "must_not_reveal_unprompted": true }
      ],
      "relationships": [
        { "character": "Arjun Rathore", "relation": "Husband. He believes he alone carries the blame for the forgery." },
        { "character": "Raghubir Singh Rathore", "relation": "Brother-in-law. He was about to expose your secret." },
        { "character": "Aditya Rathore", "relation": "Nephew, the groom. Your son's engagement is politically tied to his family's reputation." }
      ],
      "alibi_claimed": "Left the sangeet at 9:40 PM with a headache, went to rest in your room for the remainder of the evening.",
      "true_whereabouts": "Left at 9:40 PM, entered the daftar with your spare key, doubled Raghubir's insulin dose, left before he arrived. Returned during the 10:50–11:00 PM blackout and stabbed him with the kirpan, then staged the window."
    },
    {
      "player_slot": 2,
      "character_name": "Arjun Rathore",
      "is_murderer": false,
      "public_bio": "Raghubir's estranged younger brother, cut out of the family hotel business two decades ago over a land deal scandal. Runs a small travel agency in Udaipur, financially struggling.",
      "private_bio": "You've carried the blame for the forgery for twenty years, believing it protects your wife Kavita, though you've never asked her directly whether she was involved. You visited the daftar at 10:20 PM to beg your brother one last time not to reveal 'the truth' at the reception — not realizing Raghubir was already fading from the insulin.",
      "personal_objective": "Stop your brother from telling anyone about the forgery — a secret you believe is still yours to protect, not knowing your wife is the one who actually committed it.",
      "hidden_information": [
        "You visited the daftar at 10:20 PM. Raghubir was weak but alive and told you it was 'already decided.'",
        "You've long suspected, but never confirmed, that Kavita had something to do with the original forgery."
      ],
      "secrets": [
        { "content": "You have quietly resented Kavita for letting you take the blame for the forgery, though you've never confronted her.", "must_not_reveal_unprompted": false }
      ],
      "relationships": [
        { "character": "Kavita Rathore", "relation": "Wife. You suspect she may know more about the forgery than she's said." },
        { "character": "Raghubir Singh Rathore", "relation": "Older brother. He forced you out of the family business twenty years ago." }
      ],
      "alibi_claimed": "Was at the sangeet most of the evening; briefly visited the daftar around 10:20 PM to speak with Raghubir privately.",
      "true_whereabouts": "At the sangeet until 10:20 PM, then in the daftar with Raghubir (who was alive) until roughly 10:30 PM, then returned to the sangeet."
    },
    {
      "player_slot": 3,
      "character_name": "Aditya Rathore",
      "is_murderer": false,
      "public_bio": "Raghubir's only son, 29, the groom. Set to inherit the haveli and the hotel business.",
      "private_bio": "You owe a serious gambling debt to a Mumbai bookmaker. Your father discovered this days before the wedding and threatened to cut you out of the will. Your argument with him at 8:10 PM, which several guests overheard, was about this debt — not wedding nerves as everyone assumed.",
      "personal_objective": "Keep the gambling debt hidden from your bride Meera and the wider family for as long as possible.",
      "hidden_information": [
        "Your 8:10 PM argument with your father was about the debt, not the wedding.",
        "You asked Bahadur to keep the argument from being mentioned to anyone."
      ],
      "secrets": [
        { "content": "You owe a large gambling debt to a bookmaker in Mumbai.", "must_not_reveal_unprompted": true }
      ],
      "relationships": [
        { "character": "Raghubir Singh Rathore", "relation": "Father. He threatened to disinherit you over the debt just days ago." },
        { "character": "Meera Kapoor", "relation": "Bride. She does not know about the debt." },
        { "character": "Bahadur Singh", "relation": "Family retainer. He knows about your argument with your father and has kept it quiet." }
      ],
      "alibi_claimed": "Was at the sangeet all evening, visible to guests, until finding the body at 11:40 PM.",
      "true_whereabouts": "At the sangeet throughout the murder window (seen by multiple guests), went looking for his father at 11:40 PM and found the body."
    },
    {
      "player_slot": 4,
      "character_name": "Meera Kapoor",
      "is_murderer": false,
      "public_bio": "26, marrying into the Rathore family from a well-known political family in Jaipur.",
      "private_bio": "The phone call you took at 9:15 PM near the stables was from an ex-fiancé asking you to reconsider the wedding, not a vendor call as you told everyone. You're seriously unsure about going through with the marriage but haven't told Aditya.",
      "personal_objective": "Keep the truth about the phone call private, and figure out what you actually want before anyone finds out you're wavering.",
      "hidden_information": [
        "The 9:15 PM call was from an ex-fiancé, not a wedding vendor.",
        "You saw a shadowy figure near the daftar window around 10:35 PM but couldn't identify them in the rain and dark."
      ],
      "secrets": [
        { "content": "You are seriously reconsidering the wedding.", "must_not_reveal_unprompted": true }
      ],
      "relationships": [
        { "character": "Aditya Rathore", "relation": "Groom. He doesn't know you're having doubts." },
        { "character": "Raghubir Singh Rathore", "relation": "Future father-in-law. You barely knew him before this weekend." }
      ],
      "alibi_claimed": "Was near the stables around 9:15 PM taking a vendor call, then returned to the sangeet.",
      "true_whereabouts": "Near the stables 9:10–9:20 PM on a personal call, walked the garden path around 10:35 PM where you glimpsed a figure near the daftar window, then returned to the sangeet."
    },
    {
      "player_slot": 5,
      "character_name": "Bahadur Singh",
      "is_murderer": false,
      "public_bio": "In service to the Rathore family for 35 years — first as driver, now general caretaker and unofficial head of staff.",
      "private_bio": "You've long known the spare daftar key was never returned after it was lent out years ago, but you never asked for it back out of old loyalty to the family. You locked the daftar at 9:00 PM as you do every night, and noticed it unlocked again at 11:20 PM, assuming a guest had wandered in during the blackout.",
      "personal_objective": "Protect the family's name and legacy above all else, even if it means staying quiet about things you've noticed over the years.",
      "hidden_information": [
        "You locked the daftar at 9:00 PM. You noticed it unlocked at 11:20 PM.",
        "You know the spare key was never returned after being lent out years ago, though you've never said who has it."
      ],
      "secrets": [
        { "content": "You agreed to keep Aditya's 8:10 PM argument with his father from being mentioned to anyone.", "must_not_reveal_unprompted": false }
      ],
      "relationships": [
        { "character": "Raghubir Singh Rathore", "relation": "Employer of 35 years." },
        { "character": "Aditya Rathore", "relation": "Asked you to keep his argument with his father quiet." }
      ],
      "alibi_claimed": "Attending to sangeet duties and household staff throughout the evening; no fixed location during the blackout.",
      "true_whereabouts": "Moving between the kitchen, courtyard, and staff quarters all evening; genuinely no verifiable alibi during the 10:50–11:00 PM blackout."
    }
  ]
}`;

function buildPrompt(playerCount, isRetry = false, previousError = "") {
  let prompt = `You are an expert mystery writer. Your task is to generate a fully playable murder mystery scenario for a party game.
Output ONLY valid JSON. No markdown formatting, no preamble, no explanation. Just the raw JSON object.

The output MUST match this exact schema style and depth:

${KHOON_KI_BARAAT_EXAMPLE}

CRITICAL RULES:
1. "player_count" MUST be exactly ${playerCount}.
2. The "players" array MUST contain exactly ${playerCount} characters.
3. EXACTLY ONE player in the "players" array must have "is_murderer": true. All others must be false.
4. Every character MUST have at least one relationship to another named character in the "players" array.
5. The "character" field in any relationship MUST exactly match the "character_name" of someone else in the generated cast. Do not invent NPC names for relationships.
6. The difference between "alibi_claimed" and "true_whereabouts" is vital, especially for the murderer.
`;

  if (isRetry) {
    prompt += `\n\nWARNING: Your previous attempt failed validation for the following reason:\n"${previousError}"\n\nYou MUST fix this error in this attempt. Do not make the same mistake twice. Ensure player count is ${playerCount}, exactly one murderer exists, and all relationships reference valid character names in the cast.`;
  }

  return prompt;
}

function validateMystery(mystery, expectedPlayerCount) {
  if (!mystery.players || !Array.isArray(mystery.players)) {
    throw new Error("Missing or invalid 'players' array.");
  }
  
  if (mystery.player_count !== expectedPlayerCount || mystery.players.length !== expectedPlayerCount) {
    throw new Error(`Expected ${expectedPlayerCount} players, but got ${mystery.players.length}`);
  }

  const murderers = mystery.players.filter(p => p.is_murderer);
  if (murderers.length !== 1) {
    throw new Error(`Expected exactly 1 murderer, found ${murderers.length}`);
  }

  const characterNames = new Set(mystery.players.map(p => p.character_name));

  for (const player of mystery.players) {
    if (!player.relationships || player.relationships.length === 0) {
      throw new Error(`Character ${player.character_name} has no relationships.`);
    }

    for (const rel of player.relationships) {
      if (!characterNames.has(rel.character) && rel.character !== mystery.victim?.name) {
        throw new Error(`Character ${player.character_name} has a relationship with '${rel.character}', who is not in the cast or the victim.`);
      }
    }
  }
}

export async function generateMystery(playerCount) {
  let prompt = buildPrompt(playerCount);
  let rawOutput = "";
  
  // Try up to 2 times (1 initial + 1 retry)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[AI] Generating mystery for ${playerCount} players (Attempt ${attempt})...`);
      rawOutput = await generateCompletion(prompt, { json: true });
      
      let mystery;
      try {
        mystery = JSON.parse(rawOutput);
      } catch (parseError) {
        throw new Error(`JSON Parsing Failed: ${parseError.message}`);
      }

      validateMystery(mystery, playerCount);
      
      console.log(`[AI] Generation successful on attempt ${attempt}!`);
      return mystery;

    } catch (error) {
      console.error(`[AI] Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt === 1) {
        console.error("[AI] Raw output from failed attempt:", rawOutput);
        prompt = buildPrompt(playerCount, true, error.message);
      } else {
        throw new Error(`Failed to generate valid mystery after 2 attempts. Last error: ${error.message}`);
      }
    }
  }
}
