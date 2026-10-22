/**
 * 한국어 번역 계층 (Korean localization layer).
 *
 * 원본 코드는 영어 문자열을 그대로 HUD 캔버스, DOM, 간판 텍스처에 그립니다.
 * 이 모듈은 문자열 단위로 번역해 주는 작은 사전 + 패턴 모음이며,
 * 원본 로직(키 이름, 데이터 ID 등)은 건드리지 않습니다.
 */

export const KO_FONT = '"Noto Serif KR", "Nanum Myeongjo", "Apple SD Gothic Neo", "Malgun Gothic", "Batang"';

export const isKorean = (s) => /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3]/.test(s || '');

const SPECIES = {
  deer: '사슴', rabbit: '토끼', crow: '까마귀', bird: '새', raptor: '맹금',
  townsperson: '마을 주민', townswoman: '마을 여성',
};
const PART = { head: '머리', vital: '급소', body: '몸통', leg: '다리', torso: '몸통', arm: '팔' };

const DICT = {
  'sound off': '소리 끔',
  'sound on': '소리 켬',
  'dismount': '내리기',
  'mount': '말 타기',
  'warm yourself': '불 쬐기',
  'drink': '물 마시기',
  'you were seen': '들켰다',
  'move to stop': '움직이면 중단',
  'click to look around': '클릭하여 주변 둘러보기',
  'press any key for sound': '아무 키나 누르면 소리가 켜집니다',
  'you have been seen': '누군가 당신을 봤다',
  'somebody saw that': '누군가 그걸 봤다',
  'the law is after you': '보안관이 당신을 쫓고 있다',
  'you are wanted': '현상수배 중',
  'you are no longer wanted': '더 이상 수배 중이 아니다',
  'lawmen are closing in': '보안관 일행이 다가오고 있다',
  'skinning stopped': '가죽 벗기기 중단',
  // key-hint verbs
  'ride': '말 달리기', 'spur on': '박차', 'rein': '방향', 'move': '이동', 'run': '달리기',
  'crouch': '웅크리기', 'aim': '조준', 'fire': '발사', 'hold breath': '숨 참기', 'reload': '재장전',
  // pause menu
  'red sands': '레드 샌즈',
};

export function species(s) {
  const k = String(s || '').toLowerCase();
  return SPECIES[k] || s;
}
export function part(s) {
  const k = String(s || '').toLowerCase();
  return PART[k] || s;
}

/** 임의의 HUD 문자열을 번역. 모르는 문자열은 그대로 돌려준다. */
export function tr(str) {
  if (!str || isKorean(str)) return str;
  const raw = String(str);
  const k = raw.toLowerCase().trim();
  if (DICT[k] !== undefined) return DICT[k];
  let m;
  if ((m = /^take (\d+\/\d+)$/i.exec(raw))) return `수확 ${m[1]}`;
  if ((m = /^take (.+)$/i.exec(raw))) return `${tr(m[1])} 줍기`;
  if ((m = /^skin (.+)$/i.exec(raw))) return `${species(m[1].toLowerCase())} 가죽 벗기기`;
  if ((m = /^skinning\s*(.*)$/i.exec(raw))) return `${species(m[1].toLowerCase())} 가죽 벗기는 중`.trim();
  if ((m = /^(.+) skinned$/i.exec(raw))) return `${species(m[1].toLowerCase())} 가죽을 벗겼다`;
  if ((m = /^(.+) pelt$/i.exec(raw))) return `${species(m[1].toLowerCase())} 가죽`;
  if ((m = /^(.+) stowed$/i.exec(raw))) return `${tr(m[1])} 보관함`;
  if ((m = /^(.+) down\s+[—-]\s+(.+) shot$/i.exec(raw))) return `${species(m[1].toLowerCase())} 쓰러짐 - ${part(m[2].toLowerCase())} 명중`;
  if ((m = /^(.+) wounded$/i.exec(raw))) return `${species(m[1].toLowerCase())} 부상`;
  return raw;
}

/* ---- 시각 표현 -------------------------------------------------------- */
const HOUR_KO = ['열두', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열', '열한'];

/** "아침 여섯 시 반쯤" 같은 타이틀 카드용 시각 문구. */
export function timePhraseKo(h24) {
  const h = ((h24 % 24) + 24) % 24;
  const m = Math.floor((h % 1) * 60);
  const hr = Math.floor(h);
  const part = hr < 5 ? '새벽' : hr < 12 ? '아침' : hr < 17 ? '오후' : hr < 20 ? '저녁' : '밤';
  let base = hr;
  let tail;
  if (m < 8) tail = '쯤';
  else if (m < 23) tail = ' 십오 분 지나';
  else if (m < 38) tail = ' 반';
  else if (m < 53) { tail = ' 십오 분 전'; base = hr + 1; }
  else { tail = ' 직전'; base = hr + 1; }
  const name = HOUR_KO[base % 12];
  return `${part} ${name} 시${tail}`;
}

/** 모서리 시계: 오전/오후. */
export function clockStringKo(h24) {
  const h = ((h24 % 24) + 24) % 24;
  let hr = Math.floor(h);
  const m = Math.floor((h % 1) * 60);
  const ap = hr < 12 ? '오전' : '오후';
  hr = hr % 12; if (hr === 0) hr = 12;
  return `${ap} ${hr}:${String(m).padStart(2, '0')}`;
}
