import React, { createContext, useContext, useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@fantasy_auctioneer_state_v1';

const initialState = {
  hydrated: false,
  sport: null,        // 'basketball' | 'football'
  league: null,        // e.g. 'EuroLeague' | 'Greek Basket League' | 'Super League Greece' | 'UCL'
  season: null,        // e.g. '2026-2027'
  budget: 0,           // starting budget per manager
  managers: [],         // [{ id, name }]
  transfers: [],         // [{ id, managerId, personId, name, position, price, isCustom }]
  customPeople: [],       // people added mid-game, same shape as db records
};

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return { ...action.payload, hydrated: true };

    case 'START_GAME':
      return {
        ...initialState,
        hydrated: true,
        sport: action.payload.sport,
        league: action.payload.league,
        season: action.payload.season,
        budget: action.payload.budget,
        managers: action.payload.managers,
        transfers: [],
        customPeople: [],
      };

    case 'ADD_TRANSFER':
      return { ...state, transfers: [...state.transfers, action.payload] };

    case 'UNDO_TRANSFER':
      return {
        ...state,
        transfers: state.transfers.filter((t) => t.id !== action.payload.id),
      };

    case 'ADD_CUSTOM_PERSON':
      return {
        ...state,
        customPeople: [...state.customPeople, action.payload],
      };

    // Swaps the display order of two already-filled slots within the same
    // position group for the same manager (e.g. reorder who shows as DEF #1
    // vs DEF #2). Purely cosmetic — never touches price, owner, or the
    // player's real position, so data stays consistent.
    case 'SWAP_TRANSFER_ORDER': {
      const { idA, idB } = action.payload;
      const arr = [...state.transfers];
      const iA = arr.findIndex((t) => t.id === idA);
      const iB = arr.findIndex((t) => t.id === idB);
      if (iA === -1 || iB === -1) return state;
      [arr[iA], arr[iB]] = [arr[iB], arr[iA]];
      return { ...state, transfers: arr };
    }

    // Reassigns an existing pick from one manager to another (e.g. bailing
    // out a manager who's run dry, or the classic "I'll take him for €1"
    // scenario) — same person/position, new owner and new price.
    case 'REASSIGN_TRANSFER': {
      const { transferId, toManagerId, price } = action.payload;
      return {
        ...state,
        transfers: state.transfers.map((t) =>
          t.id === transferId ? { ...t, managerId: toManagerId, price } : t
        ),
      };
    }

    case 'RESET':
      return { ...initialState, hydrated: true };

    default:
      return state;
  }
}

const GameStateContext = createContext(null);
const GameDispatchContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load persisted state once on mount.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          dispatch({ type: 'HYDRATE', payload: JSON.parse(raw) });
        } else {
          dispatch({ type: 'HYDRATE', payload: initialState });
        }
      } catch (e) {
        dispatch({ type: 'HYDRATE', payload: initialState });
      }
    })();
  }, []);

  // Persist on every change, after initial hydration.
  useEffect(() => {
    if (!state.hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error('useGameState must be used within GameProvider');
  return ctx;
}

export function useGameDispatch() {
  const ctx = useContext(GameDispatchContext);
  if (!ctx) throw new Error('useGameDispatch must be used within GameProvider');
  return ctx;
}
