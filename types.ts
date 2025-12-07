export enum Direction {
  UP, DOWN, LEFT, RIGHT, NONE
}

export enum EntityState {
  IDLE,
  WALK,
  RUN_AWAY,
  CHASE, // New state for aggressive enemies
  CAUGHT,
  SURPRISED // Brief freeze before running
}

export enum NpcType {
  GIRL_BLONDE = 0,
  GIRL_REDHEAD = 1,
  ENEMY_EYE = 2,
  BOSS_EYE = 3 // Special boss for level 25
}

export enum ItemType {
  HEALTH_BOOST = 0,
  SPEED_BOOST = 1,
  STEALTH_CLOAK = 2,
  TIME_FREEZE = 3,
  LORE_NOTE = 4,
  SUNGLASSES = 5
}

export interface Entity {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  direction: Direction;
  state: EntityState;
  frameTimer: number;
  currentFrame: number;
}

export interface Player extends Entity {
  isSpamming: boolean;
  mana: number;       // 0 to 100
  maxMana: number;    // 100
  confusedTimer: number; // Frames remaining for "Lost Control"
  inBush: boolean;    // Whether player is currently in a bush
  upgrades: UpgradeType[]; // Active upgrades for this run
}

export interface Npc extends Entity {
  alerted: boolean;
  reactionTimer: number; // Countdown before running
  type: NpcType;
  isBoss?: boolean; // For boss enemies
}

export interface Item {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: ItemType;
  collected: boolean;
  message?: string; // For lore items
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface GameState {
  score: number;
  level: number;
  gameOver: boolean;
  gameWon: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface Bush {
  x: number;
  y: number;
  radius: number;
}

export enum UpgradeRarity {
  COMMON = 'Common',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary'
}

export enum UpgradeType {
  LYNRASK_NEVER = 'lynrask_never',
  BUSK_WOOKIE = 'busk_wookie',
  EKSPLOSIV_AVGANG = 'eksplosiv_avgang',
  SPEED_BOOST = 'speed_boost',
  HEALTH_REGEN = 'health_regen',
  TIME_EXTENSION = 'time_extension'
}

export interface Upgrade {
  type: UpgradeType;
  rarity: UpgradeRarity;
  name: string;
  description: string;
  icon: string;
}