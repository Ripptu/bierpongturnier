/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useTournamentStore } from './store/useTournamentStore';
import { SetupView } from './components/SetupView';
import { PlayingView } from './components/PlayingView';

export default function App() {
  const { status } = useTournamentStore();

  return (
    <div className="min-h-screen bg-white">
      {status === 'setup' ? <SetupView /> : <PlayingView />}
    </div>
  );
}
