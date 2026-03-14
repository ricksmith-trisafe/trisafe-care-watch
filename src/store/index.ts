import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage/session'; // Use sessionStorage
import { api } from '../services/api';
import agentReducer from './slices/agentSlice';
import authReducer from './slices/authSlice';
import callReducer from './slices/callSlice';
import clinicalReducer from './slices/clinicalSlice';
import patientReducer from './slices/patientSlice';

// Persist config for call slice - exclude non-serializable fields
const callPersistConfig = {
  key: 'call',
  storage,
  // Only persist these fields
  whitelist: ['agentStatus', 'activeCalls', 'currentCallId', 'isOnHold', 'activeCallTime', 'totalHoldTime', 'afterCallTime'],
};

// Persist config for auth slice
const authPersistConfig = {
  key: 'auth',
  storage,
};

// Persist config for patient slice
const patientPersistConfig = {
  key: 'patient',
  storage,
  // Persist all patient state for session continuity
  whitelist: ['patientTabs', 'currentPatient', 'patientDataCache'],
};

const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  agent: agentReducer,
  auth: persistReducer(authPersistConfig, authReducer),
  call: persistReducer(callPersistConfig, callReducer),
  clinical: clinicalReducer,
  patient: persistReducer(patientPersistConfig, patientReducer),
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'call/setIncomingSession',
          'call/setCurrentSession',
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
        ],
        ignoredPaths: ['call.incomingSession', 'call.currentSession'],
      },
    }).concat(api.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
