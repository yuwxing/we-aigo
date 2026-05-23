import React, { createContext, useContext, useReducer, useCallback } from 'react';

const GameContext = createContext(null);

const initialState = {
  screen: 'loading', // loading | lobby | task | reward
  loadProgress: 0,
  player: {
    level: 6,
    xp: 320,
    title: '语言探索者',
    skills: { listening: 0.38, grammar: 0.32, reading: 0.40, writing: 0.35 },
  },
  zones: [
    { id: 'english', label: '英语核心区', icon: '🔴', locked: false },
    { id: 'grammar', label: '语法实验室', icon: '🟠', locked: false },
    { id: 'listening', label: '听说站', icon: '🔵', locked: false },
    { id: 'writing', label: '写作舱', icon: '🟢', locked: false },
  ],
  quests: [
    { id: 1, title: '英语阅读主线任务', type: 'MAIN QUEST', zoneId: 'english', xp: 50, description: '提升英语阅读理解能力' },
    { id: 2, title: '语法强化支线任务', type: 'SIDE QUEST', zoneId: 'grammar', xp: 30, description: '掌握英语语法结构' },
    { id: 3, title: '听说挑战任务', type: 'DAILY QUEST', zoneId: 'listening', xp: 40, description: '训练英语听说能力' },
    { id: 4, title: '写作进化任务', type: 'SIDE QUEST', zoneId: 'writing', xp: 60, description: '提升英语写作能力' },
  ],
  currentQuestId: null,
  completedQuestIds: [],
  unlockedZones: ['english'],
  reward: null,
  rewardPhase: 'idle',
  aiMessages: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOAD_PROGRESS':
      return { ...state, loadProgress: action.val };
    case 'SET_SCREEN':
      return { ...state, screen: action.screen };
    case 'SELECT_QUEST':
      return { ...state, currentQuestId: action.id };
    case 'START_TASK':
      return {
        ...state,
        screen: 'task',
        aiMessages: action.messages || [],
      };
    case 'ADD_AI_MESSAGE':
      return { ...state, aiMessages: [...state.aiMessages, action.msg] };
    case 'COMPLETE_QUEST':
      return {
        ...state,
        screen: 'reward',
        completedQuestIds: [...state.completedQuestIds, action.id],
        reward: action.reward,
        rewardPhase: 'freeze',
      };
    case 'SET_REWARD_PHASE':
      return { ...state, rewardPhase: action.phase };
    case 'CLEAR_REWARD':
      return {
        ...state, reward: null, rewardPhase: 'idle',
        screen: 'lobby', currentQuestId: null,
      };
    case 'UNLOCK_ZONE':
      return {
        ...state,
        unlockedZones: state.unlockedZones.includes(action.id)
          ? state.unlockedZones : [...state.unlockedZones, action.id],
      };
    case 'ADD_XP':
      return {
        ...state,
        player: { ...state.player, xp: state.player.xp + action.amount },
      };
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setLoadProgress = useCallback((val) => dispatch({ type: 'SET_LOAD_PROGRESS', val }), []);
  const setScreen = useCallback((screen) => dispatch({ type: 'SET_SCREEN', screen }), []);
  const selectQuest = useCallback((id) => dispatch({ type: 'SELECT_QUEST', id }), []);
  const startTask = useCallback((id, messages) => dispatch({ type: 'START_TASK', id, messages }), []);
  const addAiMessage = useCallback((msg) => dispatch({ type: 'ADD_AI_MESSAGE', msg }), []);
  const completeQuest = useCallback((id, reward) => dispatch({ type: 'COMPLETE_QUEST', id, reward }), []);
  const setRewardPhase = useCallback((phase) => dispatch({ type: 'SET_REWARD_PHASE', phase }), []);
  const clearReward = useCallback(() => dispatch({ type: 'CLEAR_REWARD' }), []);
  const unlockZone = useCallback((id) => dispatch({ type: 'UNLOCK_ZONE', id }), []);
  const addXp = useCallback((amount) => dispatch({ type: 'ADD_XP', amount }), []);

  const value = {
    state, setLoadProgress, setScreen, selectQuest, startTask, addAiMessage,
    completeQuest, setRewardPhase, clearReward, unlockZone, addXp,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
