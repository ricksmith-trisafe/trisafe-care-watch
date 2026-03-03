/**
 * Call Timer Hook
 * Manages call, hold, and after-call timing based on agent status
 */
import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  startCallTimer,
  startHoldTimer,
  stopHoldTimer,
  startAfterCallTimer,
  tickActiveTime,
  tickHoldTime,
  tickAfterCallTime,
  resetCallTimers,
} from '../store/slices/callSlice';

export const useCallTimer = () => {
  const dispatch = useAppDispatch();
  const {
    agentStatus,
    callStartTime,
    holdStartTime,
    afterCallStartTime,
    activeCallTime,
    totalHoldTime,
    afterCallTime,
  } = useAppSelector((state) => state.call);

  const prevStatusRef = useRef(agentStatus);

  // Handle status transitions
  useEffect(() => {
    const prevStatus = prevStatusRef.current;

    // Transition to active call (from non-call state, not from hold)
    if (
      (agentStatus === 'INCOMING' || agentStatus === 'OUTGOING') &&
      prevStatus !== 'INCOMING' &&
      prevStatus !== 'OUTGOING' &&
      prevStatus !== 'HOLD'
    ) {
      dispatch(startCallTimer());
    }

    // Transition to hold
    if (agentStatus === 'HOLD' && prevStatus !== 'HOLD') {
      dispatch(startHoldTimer());
    }

    // Transition from hold back to active
    if (
      (agentStatus === 'INCOMING' || agentStatus === 'OUTGOING') &&
      prevStatus === 'HOLD'
    ) {
      dispatch(stopHoldTimer());
    }

    // Transition to after-call work
    if (agentStatus === 'AFTER_CALL' && prevStatus !== 'AFTER_CALL') {
      dispatch(startAfterCallTimer());
    }

    // Transition to available (call fully ended)
    if (
      agentStatus === 'AVAILABLE' &&
      (prevStatus === 'AFTER_CALL' ||
        prevStatus === 'INCOMING' ||
        prevStatus === 'OUTGOING' ||
        prevStatus === 'HOLD')
    ) {
      dispatch(resetCallTimers());
    }

    prevStatusRef.current = agentStatus;
  }, [agentStatus, dispatch]);

  // Timer tick effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Tick active time when on call (not on hold)
      if (
        (agentStatus === 'INCOMING' || agentStatus === 'OUTGOING') &&
        callStartTime &&
        !holdStartTime
      ) {
        dispatch(tickActiveTime());
      }

      // Tick hold time when on hold
      if (agentStatus === 'HOLD' && holdStartTime) {
        dispatch(tickHoldTime());
      }

      // Tick after-call time
      if (agentStatus === 'AFTER_CALL' && afterCallStartTime) {
        dispatch(tickAfterCallTime());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [agentStatus, callStartTime, holdStartTime, afterCallStartTime, dispatch]);

  return {
    // Total call time including hold
    totalCallTime: activeCallTime + totalHoldTime,
    activeCallTime,
    totalHoldTime,
    afterCallTime,
    isOnHold: agentStatus === 'HOLD',
    isOnCall:
      agentStatus === 'INCOMING' ||
      agentStatus === 'OUTGOING' ||
      agentStatus === 'HOLD',
    isInAfterCall: agentStatus === 'AFTER_CALL',
  };
};
