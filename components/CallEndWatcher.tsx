import { useEffect, useRef } from 'react';
import { CallingState, useCall, useCallStateHooks } from '@stream-io/video-react-native-sdk';

type Props = {
  onEnded: () => void;
};

/** Watches Stream call state so a remote hang-up closes the local UI. */
export default function CallEndWatcher({ onEnded }: Props) {
  const call = useCall();
  const { useCallCallingState, useRemoteParticipants } = useCallStateHooks();
  const callingState = useCallCallingState();
  const remotes = useRemoteParticipants();
  const hadRemoteRef = useRef(false);
  const endedRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const finish = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    onEndedRef.current();
  };

  useEffect(() => {
    if (remotes.length > 0) {
      hadRemoteRef.current = true;
      return;
    }
    if (hadRemoteRef.current && remotes.length === 0) {
      finish();
    }
  }, [remotes.length]);

  useEffect(() => {
    if (
      callingState === CallingState.LEFT ||
      callingState === CallingState.RECONNECTING_FAILED
    ) {
      finish();
    }
  }, [callingState]);

  useEffect(() => {
    if (!call) return;
    const unsubEnded = call.on('call.ended', finish);
    const unsubLeft = call.on('call.session_participant_left', () => {
      const count = call.state.remoteParticipants?.length ?? remotes.length;
      if (hadRemoteRef.current && count === 0) finish();
    });
    return () => {
      unsubEnded?.();
      unsubLeft?.();
    };
  }, [call]);

  return null;
}
