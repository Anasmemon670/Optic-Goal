/**
 * AI Service
 * Handles OpenAI API integration for AI Assistant
 * All AI API calls are done here (backend-only, secure)
 */

const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Generate AI response for user query
 * @param {string} userMessage - User's question/message
 * @param {Object} context - Context data (match data, predictions, etc.)
 * @returns {Promise<string>} AI-generated response
 */
const generateAIResponse = async (userMessage, context = {}) => {
  try {
    // If no API key, return a helpful message
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AIService] OPENAI_API_KEY not set, using fallback response');
      return generateFallbackResponse(userMessage, context);
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(context);

    // Build user prompt with context
    const userPrompt = buildUserPrompt(userMessage, context);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    let aiResponse = completion.choices[0]?.message?.content || '';
    
    // CRITICAL: Ensure response is never empty or blank
    if (!aiResponse || aiResponse.trim().length === 0) {
      console.warn('[AIService] Empty AI response received, using fallback');
      return generateFallbackResponse(userMessage, context);
    }
    
    // Ensure response includes key elements (explanation, confidence, disclaimer)
    // If response seems incomplete, append standard disclaimer
    const responseLower = aiResponse.toLowerCase();
    const hasConfidence = responseLower.includes('confidence') || responseLower.includes('%');
    const hasDisclaimer = responseLower.includes('disclaimer') || responseLower.includes('risk') || responseLower.includes('guarantee');
    
    // If missing key elements, append them
    if (!hasDisclaimer) {
      aiResponse += '\n\n⚠️ **Risk Disclaimer:** Sports predictions are based on statistical analysis and historical data. Actual match outcomes can vary significantly due to unpredictable factors such as injuries, weather, referee decisions, and team motivation. These predictions should not be considered guarantees.';
    }
    
    return aiResponse;
  } catch (error) {
    console.error('[AIService] Error calling OpenAI:', error.message);
    
    // Handle specific OpenAI errors
    if (error.status === 429) {
      return 'I apologize, but the AI service is currently experiencing high demand. Please try again in a moment.';
    } else if (error.status === 401) {
      console.error('[AIService] Invalid OpenAI API key');
      return generateFallbackResponse(userMessage, context);
    } else {
      // For other errors, use fallback
      return generateFallbackResponse(userMessage, context);
    }
  }
};

/**
 * Build system prompt for AI
 * CRITICAL: Must ensure AI always provides explanation, confidence, and risk disclaimer
 */
const buildSystemPrompt = (context) => {
  const hasMatchData = !!context.matchData;
  const hasPredictions = !!(context.predictions && context.predictions.length > 0);
  const hasLimitedData = !hasMatchData || !hasPredictions;
  
  return `You are an expert sports analyst AI assistant for OptikGoal, a sports prediction platform. Your role is to ANALYZE and EXPLAIN, not guess.

**CRITICAL REQUIREMENTS - Your response MUST include:**

1. **EXPLANATION (Why)**: Always explain your reasoning in detail. Don't just state conclusions.
   - What factors influenced your analysis?
   - What data points are most significant?
   - What patterns or trends did you identify?

2. **CONFIDENCE LEVEL**: Always state your confidence level clearly.
   - Format: "Confidence Level: [High/Moderate/Low] ([X]%)"
   - High: 70%+ confidence
   - Moderate: 50-69% confidence
   - Low: Below 50% confidence

3. **RISK DISCLAIMER**: Always include a risk disclaimer, especially when:
   - Data is limited or incomplete
   - Match hasn't started yet
   - Limited historical data available
   - Live match with incomplete statistics
   
   Format: "⚠️ Risk Disclaimer: [Explain limitations and risks]"

**Response Structure:**
- Start with a clear answer to the user's question
- Provide detailed explanation with reasoning
- Include confidence level
- Add risk disclaimer when appropriate
- Use natural, conversational language like a human analyst

**Available Data:**
${hasMatchData ? '✅ Match data is available for analysis' : '❌ No specific match data provided'}
${hasPredictions ? '✅ Prediction data is available' : '❌ No prediction data available'}
${context.teamStats ? '✅ Team statistics are available' : ''}
${hasLimitedData ? '\n⚠️ WARNING: Limited data available - be explicit about this in your response and include strong risk disclaimer.' : ''}

**Remember:** 
- Sports predictions are NEVER guarantees
- Always be honest about uncertainty
- If data is limited, clearly state this and explain how it affects your analysis
- Format clearly with paragraphs or bullet points as appropriate`;
};

/**
 * Build user prompt with context
 * CRITICAL: Structure input as userQuestion + matchContext + predictionSummary
 */
const buildUserPrompt = (userMessage, context) => {
  let prompt = `=== USER QUESTION ===\n${userMessage}\n\n`;

  // Add match context if available
  if (context.matchData) {
    prompt += `=== MATCH CONTEXT ===\n`;
    prompt += `Home Team: ${context.matchData.homeTeam || 'Unknown'}\n`;
    prompt += `Away Team: ${context.matchData.awayTeam || 'Unknown'}\n`;
    prompt += `League: ${context.matchData.league || 'Unknown'}\n`;
    prompt += `Match Date: ${context.matchData.matchDate || 'Unknown'}\n`;
    
    if (context.matchData.isLive) {
      prompt += `Status: LIVE MATCH\n`;
      prompt += `Current Score: ${context.matchData.homeScore || 0} - ${context.matchData.awayScore || 0}\n`;
      prompt += `⚠️ Note: This is a live match - analysis is based on current score and limited live statistics.\n`;
    } else {
      prompt += `Status: Upcoming/Scheduled Match\n`;
    }
    
    if (context.matchData.statistics && context.matchData.statistics.length > 0) {
      prompt += `\nLive Statistics Available:\n${JSON.stringify(context.matchData.statistics, null, 2)}\n`;
    } else {
      prompt += `\n⚠️ Limited Statistics: No detailed statistics available for this match.\n`;
    }
  } else {
    prompt += `=== MATCH CONTEXT ===\n`;
    prompt += `⚠️ No specific match data provided - analysis will be general.\n`;
  }

  // Add prediction summary if available
  if (context.predictions && context.predictions.length > 0) {
    prompt += `\n=== PREDICTION SUMMARY ===\n`;
    prompt += `Number of Predictions: ${context.predictions.length}\n\n`;
    context.predictions.forEach((pred, idx) => {
      prompt += `Prediction ${idx + 1}:\n`;
      prompt += `  - Tip: ${pred.tip || pred.prediction || 'N/A'}\n`;
      prompt += `  - Confidence: ${pred.confidence || 'N/A'}%\n`;
      if (pred.type || pred.predictionType) {
        prompt += `  - Type: ${pred.type || pred.predictionType}\n`;
      }
      if (pred.notes) {
        prompt += `  - Notes: ${pred.notes}\n`;
      }
      prompt += `\n`;
    });
    prompt += `\nYour task: EXPLAIN these predictions in natural language. Why were these predictions made? What factors support them?\n`;
  } else {
    prompt += `\n=== PREDICTION SUMMARY ===\n`;
    prompt += `⚠️ No existing predictions found for this match.\n`;
    prompt += `Your task: Generate analysis and predictions based on available match data.\n`;
  }

  // Add team statistics if available
  if (context.teamStats) {
    prompt += `\n=== TEAM STATISTICS ===\n`;
    prompt += JSON.stringify(context.teamStats, null, 2);
    prompt += `\n`;
  }

  // Add standings if available
  if (context.standings) {
    prompt += `\n=== LEAGUE STANDINGS ===\n`;
    prompt += JSON.stringify(context.standings, null, 2);
    prompt += `\n`;
  }

  // Final instruction
  prompt += `\n=== INSTRUCTIONS ===\n`;
  prompt += `Based on the above data, provide a comprehensive analysis that:\n`;
  prompt += `1. Answers the user's question clearly\n`;
  prompt += `2. Explains your reasoning in detail (WHY, not just WHAT)\n`;
  prompt += `3. Includes a confidence level (High/Moderate/Low with percentage)\n`;
  prompt += `4. Includes a risk disclaimer (especially if data is limited)\n`;
  prompt += `5. Uses natural, conversational language like a human sports analyst\n`;
  prompt += `6. Is honest about uncertainty and data limitations\n`;

  return prompt;
};

/**
 * Generate fallback response when AI is unavailable
 * CRITICAL: Must NEVER return empty or blank - always provide helpful response
 */
const generateFallbackResponse = (userMessage, context) => {
  const lowerMessage = userMessage.toLowerCase();

  // Match analysis queries
  if (lowerMessage.includes('win') || lowerMessage.includes('who will win') || lowerMessage.includes('prediction')) {
    if (context.matchData) {
      return `Based on the available data for ${context.matchData.homeTeam} vs ${context.matchData.awayTeam}:

**Analysis:**
- This is a ${context.matchData.league || 'league'} match
- Match scheduled for: ${context.matchData.matchDate || 'TBD'}

**Note:** For a detailed prediction with confidence levels, I would need access to:
- Recent team form (last 5 matches)
- Head-to-head history
- Current league standings
- Injury updates and squad availability

**Risk Disclaimer:** Predictions are based on statistical analysis and should not be considered guarantees. Sports outcomes are inherently unpredictable.

Would you like me to analyze a specific match? Please provide the match ID or team names.`;
    }
    return `I can help you analyze matches and provide predictions! To give you the best analysis, I need:

1. **Match Information**: Which match are you interested in? (You can provide match ID or team names)
2. **Your Question**: What specifically would you like to know?
   - Who will win and why?
   - Is over/under safe?
   - Compare both teams' form
   - Goal prediction

Please provide a match ID or describe the match you'd like analyzed.`;
  }

  // Over/under queries
  if (lowerMessage.includes('over') || lowerMessage.includes('under') || lowerMessage.includes('goals')) {
    return `For over/under analysis, I analyze:
- Average goals per team
- Recent scoring trends
- Head-to-head goal history
- Defensive strength

**Risk Disclaimer:** Goal predictions are statistical estimates. Actual match outcomes can vary significantly.

To provide a specific over/under analysis, please share the match ID or team names.`;
  }

  // Team comparison queries
  if (lowerMessage.includes('compare') || lowerMessage.includes('form') || lowerMessage.includes('team')) {
    return `I can compare teams by analyzing:
- Recent form (last 5 matches)
- League position and points
- Goal statistics (scored/conceded)
- Head-to-head record
- Home/away performance

**Risk Disclaimer:** Team comparisons are based on historical data and may not reflect current form or unexpected factors.

Please provide the match ID or team names for a detailed comparison.`;
  }

  // Default response - ALWAYS include explanation, confidence, and disclaimer
  return `I'm your AI sports analyst assistant! I can help you with:

📊 **Match Analysis**
- Who will win and why?
- Goal predictions
- Team form comparison
- Over/under analysis

💡 **How to use:**
- Ask about a specific match: "Who will win match ID 123456?"
- Compare teams: "Compare Manchester United vs Liverpool"
- Get predictions: "Is over 2.5 safe for this match?"

**Confidence Level:** N/A (General information only)

⚠️ **Risk Disclaimer:** The AI analysis service is currently experiencing technical difficulties. For detailed match analysis, please try again in a moment or provide a specific match ID for analysis.

Please provide a match ID or describe what you'd like to analyze!`;
};

/**
 * Analyze match and generate AI prediction explanation
 * @param {Object} matchData - Match data from database
 * @param {Array} predictions - Existing predictions from prediction engine
 * @param {Object} userQuery - User's question about the match
 * @returns {Promise<string>} AI-generated analysis
 */
const analyzeMatch = async (matchData, predictions = [], userQuery = 'Analyze this match and provide a prediction') => {
  const context = {
    matchData: {
      homeTeam: matchData.homeTeam || matchData.teams?.home?.name,
      awayTeam: matchData.awayTeam || matchData.teams?.away?.name,
      league: matchData.league || matchData.league?.name,
      matchDate: matchData.matchDate || matchData.fixture?.date,
      isLive: matchData.isLive || matchData.fixture?.status?.short === 'LIVE',
      homeScore: matchData.homeScore || matchData.goals?.home,
      awayScore: matchData.awayScore || matchData.goals?.away,
      statistics: matchData.statistics || matchData.rawData?.statistics,
    },
    predictions: predictions.map(p => ({
      tip: p.tip || p.prediction,
      confidence: p.confidence,
      notes: p.notes,
    })),
    teamStats: matchData.teamStats,
    standings: matchData.standings,
  };

  return await generateAIResponse(userQuery, context);
};

module.exports = {
  generateAIResponse,
  analyzeMatch,
};
