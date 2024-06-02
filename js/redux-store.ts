import { configureStore } from '@reduxjs/toolkit'

import rootReducer from './reducers'

const store = configureStore({
  reducer: rootReducer,
  // Some arguments of the following actions are functions (which can't be serialized).
  // "A non-serializable value was detected in an action" error will be thrown without this middleware.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'modal/showModal',
          'modal/closeModal',
          'modal/confirmationOn',
          'modal/confirmationOff'
        ]
      }
    })
})

export default store
