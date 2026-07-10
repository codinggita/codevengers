import { generateCompletion } from './llmClient.js';

function buildInvestigationPrompt(player, actionText, mystery, discoveredClues) {
  return `You are the Game Master for a murder mystery game.
The victim is ${mystery.victim?.name}.
The player's character is ${player.character?.character_name}.

Player Action/Query: "${actionText}"

Available Undiscovered Clues (JSON):
${JSON.stringify(mystery.clues?.filter(c => !discoveredClues.includes(c.id)) || [])}

INSTRUCTIONS:
1. Compare the Player Action to the 'trigger_keywords' of the available undiscovered clues.
2. If the action is a reasonable match for a clue's keywords (or strongly implies the same action), select that clue.
3. If no clue matches, or the player is asking a general question, return a flavor text response describing what happens or what they find (e.g. "You search the garden but find only wet leaves."). Do NOT invent new clues or facts.
4. You MUST NEVER reveal the murderer's identity, the full secret, or the solution.

Respond ONLY with valid JSON in this exact format:
{
  "matched_clue_id": "clue_01", // Or null if no clue matched
  "flavor_text": "You dig through the mud and find a torn piece of a train ticket."
}`;
}

export async function processInvestigation(player, actionText, mystery, discoveredClues) {
  const prompt = buildInvestigationPrompt(player, actionText, mystery, discoveredClues);
  
  try {
    const rawOutput = await generateCompletion(prompt, { json: true });
    const response = JSON.parse(rawOutput);

    // Guardrail Check: String-match safety net
    const murderer = mystery.players.find(p => p.is_murderer);
    const murdererName = murderer?.character_name?.toLowerCase() || '';
    const responseText = response.flavor_text?.toLowerCase() || '';

    // If the LLM tries to name the murderer or use the word "murderer" in an answering way, block it
    if (murdererName && responseText.includes(murdererName) && (responseText.includes("killed") || responseText.includes("murderer") || responseText.includes("did it"))) {
       console.warn("[Guardrail] Intercepted potential leak from LLM.");
       return {
         matched_clue_id: null,
         flavor_text: "The Game Master smiles cryptically. 'You'll have to figure that out yourself.'"
       };
    }
    
    // Explicit ask guardrail
    const actionLower = actionText.toLowerCase();
    if (actionLower.includes("who is the murderer") || actionLower.includes("who killed") || actionLower.includes("tell me the answer")) {
        return {
          matched_clue_id: null,
          flavor_text: "The Game Master shakes his head. 'I cannot simply tell you the answer. You must investigate.'"
        };
    }

    return {
      matched_clue_id: response.matched_clue_id || null,
      flavor_text: response.flavor_text || "You look around but find nothing of note."
    };

  } catch (error) {
    console.error("[Game Master] Investigation failed:", error);
    return {
      error: "SYSTEM_ERROR: The Game Master lost connection. Please try your action again.",
      matched_clue_id: null
    };
  }
}

export async function generateEpilogue(mystery, murderer, votingResults, success) {
  const prompt = `You are the Game Master for a murder mystery game. The game has just concluded.
The victim was ${mystery.victim?.name}.
The true murderer was ${murderer.character_name}.
The players voted on who they thought the murderer was.

Did the players succeed in catching the murderer? ${success ? 'YES' : 'NO'}

Player Votes and Motives:
${JSON.stringify(votingResults, null, 2)}

INSTRUCTIONS:
Write a dramatic, 2-3 paragraph epilogue for the game.
If they succeeded (YES), describe how the truth was laid bare, the evidence that damned the murderer, and justice being served.
If they failed (NO), describe how the innocent were blamed, the true murderer slipped away, and the tragedy of the unsolved crime.
Focus on the atmosphere and the characters involved. Do NOT output JSON, just write the narrative text directly.`;

  // Fallback templates if the LLM hangs or fails
  const fallbackSuccess = `The evidence was presented, and the truth laid bare. The murderer was ${murderer.character_name}. Cornered by the facts and the united accusations of the guests, they finally confessed. They were caught and brought to justice, bringing a somber peace to the tragedy.`;
  
  const fallbackFailure = `Despite the accusations flying around the room, the true killer went unnoticed. The murderer was ${murderer.character_name}. While the guests bickered and blamed the innocent, the real culprit slipped away into the night, leaving the tragedy unsolved and the guilty unpunished.`;
  
  const fallbackText = success ? fallbackSuccess : fallbackFailure;

  // Add a strict timeout to the epilogue generation
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Epilogue generation timed out')), 15000)
  );

  try {
    const rawOutput = await Promise.race([
      generateCompletion(prompt, { json: false }),
      timeoutPromise
    ]);
    
    return rawOutput.trim();
  } catch (error) {
    console.error("[Game Master] Epilogue generation failed or timed out:", error);
    return fallbackText;
  }
}
