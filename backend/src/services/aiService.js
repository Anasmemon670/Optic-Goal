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
    
    // Only enforce sports-style disclaimer for sports/prediction questions.
    // For platform/navigation questions, adding a "risk disclaimer" makes replies noisy.
    const isSports = isSportsQuestion(userMessage, context);
    if (isSports) {
      const responseLower = aiResponse.toLowerCase();
      const hasDisclaimer =
        responseLower.includes('disclaimer') ||
        responseLower.includes('risk') ||
        responseLower.includes('guarantee');
      if (!hasDisclaimer) {
        aiResponse += '\n\n⚠️ **Risk Disclaimer:** Sports predictions are based on statistical analysis and historical data. Actual match outcomes can vary due to unpredictable factors (injuries, weather, referee decisions, motivation). These predictions are not guarantees.';
      }
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
 * Determine whether the user is asking for sports analysis vs platform guidance
 * (basic heuristic; the system prompt also guides behavior).
 */
const isSportsQuestion = (userMessage = '', context = {}) => {
  if (context?.matchData) return true;
  const msg = String(userMessage || '').toLowerCase();

  // Platform/navigation terms (take precedence)
  const platformTerms = [
    'website',
    'site',
    'app',
    'page',
    'navigate',
    'navigation',
    'where is',
    'how to use',
    'how do i',
    'login',
    'sign up',
    'signup',
    'register',
    'profile',
    'settings',
    'notifications',
    'community',
    'news',
    'bulletin',
    'live scores',
    'live matches',
    'admin',
    'dashboard',
  ];
  if (platformTerms.some((t) => msg.includes(t))) return false;

  // Sports/prediction terms
  const sportsTerms = [
    'who will win',
    'prediction',
    'predict',
    'odds',
    'over',
    'under',
    'btts',
    'both teams to score',
    'goal',
    'goals',
    'score',
    'form',
    'head to head',
    'h2h',
    'fixture',
    'match id',
    'vs ',
  ];
  return sportsTerms.some((t) => msg.includes(t));
};

/**
 * Build system prompt for AI
 * CRITICAL: Must ensure AI always provides explanation, confidence, and risk disclaimer
 */
const buildSystemPrompt = (context) => {
  const hasMatchData = !!context.matchData;
  const hasPredictions = !!(context.predictions && context.predictions.length > 0);
  const hasLimitedData = !hasMatchData || !hasPredictions;
  
  const platformGuide = buildPlatformGuideContext();

  return `You are OptikGoal's AI Assistant.

You have TWO jobs:
1) **Platform Guide (primary for website/app questions):** Help users understand and navigate OptikGoal (pages, features, where to click, what things mean).
2) **Sports Analyst (only for match/prediction questions):** Analyze matches and explain predictions using provided data.

**ANTI-REPETITION (Important):**
- Do NOT repeat the exact same answer verbatim if the user asks a similar question again.
- If something was already explained, give a short recap (1–3 lines) and add new actionable details, or ask 1 clarifying question.

**VIP POLICY (Important):**
- Do NOT explain VIP/premium subscription details, pricing, plans, or VIP-only features.
- If the user asks about VIP, politely say you can't help with VIP topics and redirect them to non‑VIP features/navigation.

========================
PLATFORM GUIDE CONTEXT
========================
${platformGuide}

========================
SPORTS ANALYSIS RULES
========================
You are an expert sports analyst AI assistant for OptikGoal, a sports prediction platform. Your role is to ANALYZE and EXPLAIN, not guess.

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
 * Static platform knowledge base to help the assistant answer website questions.
 * Keep it concise and accurate; do not mention VIP features.
 */
const buildPlatformGuideContext = () => {
  return `OptikGoal is a sports prediction + live scores web app.

Navigation pages you can help with:
- **Home**: Landing page with overview and an AI Assistant entry point. Also highlights live matches and key sections.
- **Predictions**: Public predictions feed and match insights (general, non‑VIP).
- **Bulletin**: Match bulletin / match board style page for browsing match info.
- **Live Scores**: Live match scores for football and basketball.
- **Community**: Community discussions/comments.
- **News**: Sports/news articles feed.
- **Profile / Settings / Notifications**: Account pages (may require login).
- **Admin**: Admin login and admin dashboard (restricted).

How to answer website questions:
- Give short, step-by-step instructions: where to click in the navbar and what the user will see.
- Explain what a feature does in plain language (no technical jargon).
- If the user asks “where is X?”, answer with the exact nav item name (e.g., “Go to ‘Live Scores’ in the top menu.”)
- If the user asks about match analysis without giving a match ID, ask them for the match ID or teams.`;
};

/**
 * Build user prompt with context
 * CRITICAL: Structure input as userQuestion + matchContext + predictionSummary
 */
const buildUserPrompt = (userMessage, context) => {
  let prompt = `=== USER QUESTION ===\n${userMessage}\n\n`;

  // Include a little recent chat so the model can avoid repeating itself.
  if (Array.isArray(context.conversation) && context.conversation.length > 0) {
    prompt += `=== RECENT CONVERSATION (for continuity; avoid repeating verbatim) ===\n`;
    context.conversation.slice(-8).forEach((m) => {
      const role = m.role === 'assistant' ? 'ASSISTANT' : 'USER';
      prompt += `${role}: ${String(m.content || '').trim()}\n`;
    });
    prompt += `\n`;
  }

  // Platform context (always helpful for website Q&A)
  if (context.platformContext || context.totalUsers || context.totalPredictions) {
    prompt += `=== PLATFORM CONTEXT ===\n`;
    if (context.platformContext) {
      prompt += `${context.platformContext}\n`;
    }
    if (typeof context.totalUsers === 'number') prompt += `Total users: ${context.totalUsers}\n`;
    if (typeof context.totalPredictions === 'number') prompt += `Total public predictions: ${context.totalPredictions}\n`;
    if (typeof context.liveFootball === 'number' || typeof context.liveBasketball === 'number') {
      const liveFootball = Number(context.liveFootball || 0);
      const liveBasketball = Number(context.liveBasketball || 0);
      prompt += `Live matches now: ${liveFootball + liveBasketball} (football: ${liveFootball}, basketball: ${liveBasketball})\n`;
    }
    prompt += `\n`;
  }

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
    // For platform questions we don't need to inject noisy match placeholders.
    // Only add this section if it seems like a sports/prediction question.
    if (isSportsQuestion(userMessage, context)) {
      prompt += `=== MATCH CONTEXT ===\n`;
      prompt += `⚠️ No specific match data provided - analysis will be general.\n`;
    }
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
    // Only include prediction instructions for sports questions.
    if (isSportsQuestion(userMessage, context)) {
      prompt += `\n=== PREDICTION SUMMARY ===\n`;
      prompt += `⚠️ No existing predictions found for this match.\n`;
      prompt += `Your task: Generate analysis and predictions based on available match data.\n`;
    }
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

  // Final instruction (platform vs sports)
  const sportsMode = isSportsQuestion(userMessage, context);
  prompt += `\n=== INSTRUCTIONS ===\n`;
  if (!sportsMode) {
    prompt += `Answer as a helpful product guide for the OptikGoal website/app:\n`;
    prompt += `- Be specific about where to click (nav item names)\n`;
    prompt += `- Give short step-by-step instructions\n`;
    prompt += `- Do NOT discuss VIP/premium features\n`;
  } else {
    prompt += `Based on the above data, provide a comprehensive sports analysis that:\n`;
    prompt += `1. Answers the user's question clearly\n`;
    prompt += `2. Explains your reasoning in detail (WHY, not just WHAT)\n`;
    prompt += `3. Includes a confidence level (High/Moderate/Low with percentage)\n`;
    prompt += `4. Includes a risk disclaimer (especially if data is limited)\n`;
    prompt += `5. Uses natural, conversational language like a human sports analyst\n`;
    prompt += `6. Is honest about uncertainty and data limitations\n`;
  }

  return prompt;
};

/**
 * Generate fallback response when AI is unavailable
 * CRITICAL: Must NEVER return empty or blank - always provide helpful response
 */
const generateFallbackResponse = (userMessage, context) => {
  const lowerMessage = userMessage.toLowerCase();

  // Platform/navigation queries (no VIP)
  if (
    lowerMessage.includes('website') ||
    lowerMessage.includes('app') ||
    lowerMessage.includes('page') ||
    lowerMessage.includes('navigate') ||
    lowerMessage.includes('where') ||
    lowerMessage.includes('how') ||
    lowerMessage.includes('login') ||
    lowerMessage.includes('signup') ||
    lowerMessage.includes('register') ||
    lowerMessage.includes('live scores') ||
    lowerMessage.includes('live matches') ||
    lowerMessage.includes('bulletin') ||
    lowerMessage.includes('community') ||
    lowerMessage.includes('news') ||
    lowerMessage.includes('predictions')
  ) {
    return `I can help you use OptikGoal (navigation + features).

**Quick guide:**
- Go to **Home** for the overview.
- Use **Predictions** for the public predictions feed.
- Use **Live Scores** to see live matches.
- Use **Bulletin** to browse match info.
- Use **Community** for discussions and comments.
- Use **News** for articles.

Tell me what you want to do (for example: “Where do I see live matches?” or “How do predictions work?”).`;
  }

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
