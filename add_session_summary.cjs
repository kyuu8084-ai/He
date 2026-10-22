const fs = require('fs');
let code = fs.readFileSync('src/components/StudyRoom.tsx', 'utf8');

const targetState = `  const [unlockedToastBadge, setUnlockedToastBadge] = useState<Badge | null>(null);`;
const replacementState = `  const [unlockedToastBadge, setUnlockedToastBadge] = useState<Badge | null>(null);\n  const [completedSessionData, setCompletedSessionData] = useState<{ durationSeconds: number } | null>(null);`;

code = code.replace(targetState, replacementState);

const targetTimerEnd = `    } else if (timerTime === 0 && timerActive) {
      setTimerActive(false);
      const sessionDuration = initialTime > 0 ? initialTime : 25 * 60;
      recordSessionAndCheckBadges({
        durationSeconds: sessionDuration,
        startTime: sessionStartTime,
        endTime: new Date(),
        isAmbientActive: activeAmbience !== 'none'
      }).then(newlyUnlocked => {
        if (newlyUnlocked && newlyUnlocked.length > 0) {
          setUnlockedToastBadge(newlyUnlocked[0]);
        }
      });
      addNotification(language === 'vi' ? '🎉 Hoàn thành phiên học tập tập trung!' : '🎉 Focus session completed!', 'success');
    }`;

const replacementTimerEnd = `    } else if (timerTime === 0 && timerActive) {
      setTimerActive(false);
      const sessionDuration = initialTime > 0 ? initialTime : 25 * 60;
      recordSessionAndCheckBadges({
        durationSeconds: sessionDuration,
        startTime: sessionStartTime,
        endTime: new Date(),
        isAmbientActive: activeAmbience !== 'none'
      }).then(newlyUnlocked => {
        if (newlyUnlocked && newlyUnlocked.length > 0) {
          setUnlockedToastBadge(newlyUnlocked[0]);
        }
      });
      setCompletedSessionData({ durationSeconds: sessionDuration });
      // auto hide after 8s
      setTimeout(() => setCompletedSessionData(null), 8000);
      addNotification(language === 'vi' ? '🎉 Hoàn thành phiên học tập tập trung!' : '🎉 Focus session completed!', 'success');
    }`;

code = code.replace(targetTimerEnd, replacementTimerEnd);

fs.writeFileSync('src/components/StudyRoom.tsx', code);
