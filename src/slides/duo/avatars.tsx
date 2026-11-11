/*
 * The characters from Ansu's Duolingo Connect prototype (src/App.jsx), so the
 * slides and the live demo show the same people: Lily, the AI partner, and the
 * three avatars a learner can call as (Maya, the learner, and you). Copied as
 * drawn, typed for the deck; keep them in step with the prototype.
 *
 * The prototype's own note stands: swap for Duolingo's official character
 * assets before anything ships.
 */

export function LilyAvatar({ isSpeaking = false, isEyeRolling = false, isCardIcon = false }: { isSpeaking?: boolean; isEyeRolling?: boolean; isCardIcon?: boolean }) {
  const viewBox = isCardIcon ? '18 14 164 176' : '0 0 200 280';

  return (
    <svg className="avatar-art" viewBox={viewBox} fill="none">
      <rect x="0" y="0" width="200" height="280" fill="#E6DEFF" />
      <g className={isSpeaking ? 'duo-talk' : ''}>
        <path d="M 44 82 C 44 16, 156 16, 156 82 L 172 175 L 25 175 Z" fill="#9B6DFF" />
        <rect x="78" y="218" width="33" height="58" fill="#9B6DFF" />
        <rect x="79" y="144" width="32" height="32" fill="#4A306D" />
        <path d="M 79 167 L 111 167 L 138 208 Q 144 222 128 222 L 62 222 Q 46 222 52 208 Z" fill="#4A306D" />
        <path d="M 67 204 C 71 196, 80 196, 83 200 L 76 208 C 70 208, 66 206, 67 204 Z" fill="#F9C4AC" />
        <path d="M 103 196 C 112 193, 121 199, 120 206 C 118 210, 111 208, 108 202 Z" fill="#F9C4AC" />
        <path d="M 55 212 Q 95 202 133 212" stroke="#3B235A" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M 68 206 L 118 208" stroke="#3B235A" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="155" cy="112" r="12" fill="#F9C4AC" />
        <path d="M 73 56 L 146 56 L 146 119 C 146 136, 134 146, 115 146 L 73 146 Z" fill="#F9C4AC" />
        <rect x="68" y="84" width="27" height="32" rx="13.5" fill="#FFFFFF" />
        <circle
          cx={isEyeRolling ? '85' : '83'}
          cy={isEyeRolling ? '97' : '101'}
          r="7.5"
          fill="#3D314A"
          style={{ transition: 'all 0.25s ease' }}
        />
        <path d="M 68 97 C 68 86, 95 86, 95 97 L 95 101 L 68 101 Z" fill="#9B6DFF" />
        <rect x="99" y="84" width="32" height="32" rx="16" fill="#FFFFFF" />
        <circle
          cx={isEyeRolling ? '116' : '113'}
          cy={isEyeRolling ? '97' : '101'}
          r="7.5"
          fill="#3D314A"
          style={{ transition: 'all 0.25s ease' }}
        />
        <path d="M 99 97 C 99 84, 131 84, 131 97 L 131 101 L 99 101 Z" fill="#9B6DFF" />
        <path d="M 97 109 C 91 116, 90 125, 97 125 C 104 125, 103 116, 97 109 Z" fill="#E08A70" />
        {isSpeaking ? (
          <ellipse cx="115" cy="132" rx="7.5" ry="5.5" fill="#4A306D">
            <animate attributeName="ry" values="1.8;6.5;2.2;5.8;1.8" dur="0.24s" repeatCount="indefinite" />
          </ellipse>
        ) : (
          <path d="M 108 136 Q 118 125 123 130" stroke="#E08A70" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        )}
        <path d="M 75 50 C 78 74, 112 87, 154 87 L 154 45 L 75 45 Z" fill="#9B6DFF" />
        <path d="M 75 52 C 84 74, 114 86, 148 86" stroke="#8556E8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M 44 65 C 44 35, 76 35, 75 52 L 75 175 L 25 175 Z" fill="#A575FF" />
      </g>
    </svg>
  );
}


export function PeerAvatar({ preset = 0, isSpeaking = false }: { preset?: 0 | 1 | 2; isSpeaking?: boolean }) {
  const mouth = (cx: number, cy: number, fill: string) =>
    isSpeaking ? (
      <ellipse cx={cx} cy={cy} rx="9" ry="11" fill={fill}>
        <animate attributeName="ry" values="4;12;5;11;4" dur="0.22s" repeatCount="indefinite" />
      </ellipse>
    ) : (
      <circle cx={cx} cy={cy} r="8" fill={fill} />
    );

  if (preset === 0) {
    return (
      <svg className="avatar-art" viewBox="0 0 280 320" fill="none">
        <rect width="280" height="320" fill="#FDF0A6" />
        <g className={isSpeaking ? 'duo-talk' : ''}>
          <g fill="#333333">
            <circle cx="140" cy="70" r="46" />
            <circle cx="95" cy="84" r="42" />
            <circle cx="185" cy="84" r="42" />
            <circle cx="68" cy="126" r="39" />
            <circle cx="212" cy="126" r="39" />
            <circle cx="64" cy="174" r="36" />
            <circle cx="216" cy="174" r="36" />
            <circle cx="84" cy="212" r="30" />
            <circle cx="196" cy="212" r="30" />
            <circle cx="140" cy="135" r="72" />
          </g>
          <path d="M72 320 L92 240 Q140 234 188 240 L208 320 Z" fill="#EFEFEF" />
          <rect x="98" y="216" width="84" height="32" rx="10" fill="#EFEFEF" />
          <circle cx="76" cy="166" r="18" fill="#D5906C" />
          <circle cx="204" cy="166" r="18" fill="#D5906C" />
          <circle cx="77" cy="187" r="17" stroke="#F7EDE2" strokeWidth="6" fill="none" />
          <circle cx="203" cy="187" r="17" stroke="#F7EDE2" strokeWidth="6" fill="none" />
          <rect x="82" y="106" width="116" height="120" rx="34" fill="#D5906C" />
          <rect x="108" y="130" width="29" height="41" rx="14.5" fill="#FFFFFF" />
          <rect x="143" y="130" width="29" height="41" rx="14.5" fill="#FFFFFF" />
          <rect x="118" y="140" width="14" height="24" rx="7" fill="#1E78D6" />
          <circle cx="117" cy="149" r="5" fill="#FFFFFF" />
          <rect x="153" y="140" width="14" height="24" rx="7" fill="#1E78D6" />
          <circle cx="152" cy="149" r="5" fill="#FFFFFF" />
          <path d="M140 163 C135 172, 131 183, 140 183 C149 183, 145 172, 140 163 Z" fill="#8F5136" />
          {mouth(152, 197, '#6E261E')}
          <path d="M154 210 Q165 209 167 197" stroke="#B87352" strokeWidth="4" strokeLinecap="round" fill="none" />
        </g>
      </svg>
    );
  }

  if (preset === 1) {
    return (
      <svg className="avatar-art" viewBox="0 0 280 320" fill="none">
        <rect width="280" height="320" fill="#D7FFB8" />
        <g className={isSpeaking ? 'duo-talk' : ''}>
          <path d="M64 320 L84 242 Q140 234 196 242 L216 320 Z" fill="#1CB0F6" />
          <rect x="94" y="218" width="92" height="30" rx="14" fill="#1899D6" />
          <circle cx="76" cy="166" r="18" fill="#F3C19D" />
          <circle cx="204" cy="166" r="18" fill="#F3C19D" />
          <rect x="82" y="108" width="116" height="118" rx="34" fill="#F3C19D" />
          <path d="M78 132 C78 72, 202 72, 202 132 L198 116 L82 116 Z" fill="#FF4B4B" />
          <rect x="74" y="96" width="132" height="26" rx="13" fill="#EA2B2B" />
          <circle cx="140" cy="68" r="16" fill="#FF4B4B" />
          <rect x="108" y="132" width="28" height="40" rx="14" fill="#FFFFFF" />
          <rect x="144" y="132" width="28" height="40" rx="14" fill="#FFFFFF" />
          <rect x="118" y="142" width="13" height="23" rx="6.5" fill="#58CC02" />
          <circle cx="117" cy="151" r="4.5" fill="#FFFFFF" />
          <rect x="154" y="142" width="13" height="23" rx="6.5" fill="#58CC02" />
          <circle cx="153" cy="151" r="4.5" fill="#FFFFFF" />
          <circle cx="122" cy="152" r="22" stroke="#333333" strokeWidth="5" fill="none" />
          <circle cx="158" cy="152" r="22" stroke="#333333" strokeWidth="5" fill="none" />
          <line x1="144" y1="152" x2="136" y2="152" stroke="#333333" strokeWidth="5" />
          <path d="M140 164 C135 173, 131 184, 140 184 C149 184, 145 173, 140 164 Z" fill="#C68B63" />
          {mouth(148, 198, '#6E261E')}
          <path d="M150 210 Q161 209 163 198" stroke="#C68B63" strokeWidth="4" strokeLinecap="round" fill="none" />
        </g>
      </svg>
    );
  }

  return (
    <svg className="avatar-art" viewBox="0 0 280 320" fill="none">
      <rect width="280" height="320" fill="#DDF4FF" />
      <g className={isSpeaking ? 'duo-talk' : ''}>
        <path d="M68 320 L88 242 Q140 234 192 242 L212 320 Z" fill="#FFC800" />
        <rect x="98" y="218" width="84" height="30" rx="12" fill="#E5A400" />
        <circle cx="76" cy="166" r="18" fill="#B9764F" />
        <circle cx="204" cy="166" r="18" fill="#B9764F" />
        <rect x="82" y="108" width="116" height="118" rx="34" fill="#B9764F" />
        <path d="M74 128 C70 68, 210 68, 206 128 C180 102, 110 102, 74 128 Z" fill="#222222" />
        <circle cx="115" cy="86" r="24" fill="#222222" />
        <circle cx="160" cy="84" r="26" fill="#222222" />
        <rect x="108" y="132" width="28" height="40" rx="14" fill="#FFFFFF" />
        <rect x="144" y="132" width="28" height="40" rx="14" fill="#FFFFFF" />
        <rect x="118" y="142" width="13" height="23" rx="6.5" fill="#3B2314" />
        <circle cx="117" cy="151" r="4.5" fill="#FFFFFF" />
        <rect x="154" y="142" width="13" height="23" rx="6.5" fill="#3B2314" />
        <circle cx="153" cy="151" r="4.5" fill="#FFFFFF" />
        <path d="M140 163 C135 172, 131 183, 140 183 C149 183, 145 172, 140 163 Z" fill="#7A4528" />
        {mouth(150, 197, '#4A1812')}
        <path d="M152 210 Q163 209 165 197" stroke="#8A5232" strokeWidth="4" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}
