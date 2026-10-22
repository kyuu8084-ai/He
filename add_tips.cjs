const fs = require('fs');
let code = fs.readFileSync('src/components/study-tools/StudyResourcesList.tsx', 'utf8');

const targetResources = `  const resources: ResourceCategory[] = [`;

const replacementResources = `  const resources: ResourceCategory[] = [
    {
      category: isVi ? 'Mẹo Học Tập' : 'Study Tips',
      icon: <BrainCircuit size={16} className="text-[#F598F2]" />,
      items: [
        {
          id: 'tip-1',
          title: isVi ? 'Cách chống buồn ngủ' : 'How to stay awake',
          desc: isVi ? 'Những phương pháp tự nhiên giúp bạn tỉnh táo khi ôn thi.' : 'Natural methods to stay alert during exam prep.',
          link: '#',
          badge: isVi ? 'Thực tế' : 'Practical',
          type: 'tip',
          content: isVi ? [
            'Uống nước lạnh từng ngụm nhỏ.',
            'Vươn vai và đi lại mỗi 30 phút.',
            'Giữ phòng học luôn đủ ánh sáng trắng.',
            'Nghe nhạc không lời hoặc nhịp điệu nhanh.'
          ] : [
            'Drink cold water in small sips.',
            'Stretch and walk around every 30 mins.',
            'Keep your study room well-lit.',
            'Listen to fast-paced instrumental music.'
          ]
        },
        {
          id: 'tip-2',
          title: isVi ? 'Khắc phục mất tập trung' : 'Overcoming Distractions',
          desc: isVi ? 'Chiến lược giữ tâm trí luôn ở trạng thái Flow.' : 'Strategies to keep your mind in the Flow state.',
          link: '#',
          badge: isVi ? 'Tâm lý' : 'Mindset',
          type: 'tip',
          content: isVi ? [
            'Để điện thoại ở phòng khác hoặc chế độ máy bay.',
            'Dọn dẹp bàn học chỉ để lại những thứ cần thiết.',
            'Ghi những ý nghĩ lang thang ra một tờ giấy nháp.',
            'Dùng kỹ thuật Pomodoro (25 phút học, 5 phút nghỉ).'
          ] : [
            'Leave phone in another room or on airplane mode.',
            'Clear your desk of non-essentials.',
            'Write wandering thoughts on a piece of paper.',
            'Use Pomodoro technique (25m focus, 5m break).'
          ]
        },
        {
          id: 'tip-3',
          title: isVi ? 'Ghi nhớ dài hạn' : 'Long-term Memory',
          desc: isVi ? 'Cách lưu trữ thông tin sâu vào não bộ.' : 'How to store information deep in the brain.',
          link: '#',
          badge: isVi ? 'Khoa học' : 'Science',
          type: 'tip',
          content: isVi ? [
            'Sử dụng Gợi nhớ chủ động (Active Recall).',
            'Lặp lại ngắt quãng (Spaced Repetition) với Flashcards.',
            'Dạy lại kiến thức cho người khác (Feynman).',
            'Ngủ đủ 7-8 tiếng để não bộ xử lý thông tin.'
          ] : [
            'Use Active Recall.',
            'Use Spaced Repetition with Flashcards.',
            'Teach the concept to someone else (Feynman).',
            'Get 7-8 hours of sleep for memory consolidation.'
          ]
        }
      ]
    },`;

code = code.replace(targetResources, replacementResources);
fs.writeFileSync('src/components/study-tools/StudyResourcesList.tsx', code);
