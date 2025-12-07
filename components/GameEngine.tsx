import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Entity, Npc, Player, Direction, EntityState, Point, Particle, NpcType, Item, ItemType, Bush, Upgrade, UpgradeRarity, UpgradeType } from '../types';
import { TILE_SIZE, VIRTUAL_WIDTH, VIRTUAL_HEIGHT, PLAYER_SPEED, NPC_WALK_SPEED, NPC_RUN_SPEED, RUNK_DISTANCE, CHARGE_DISTANCE, CHARGE_RATE, DETECTION_PROXIMITY_THRESHOLD, FPS, RUNK_DEPLETION_RATE, BUSH_RADIUS, MANA_DECAY_RATE, SUNGLASSES_STEALTH_TIME } from '../constants';
import { loadSprites } from '../assets/spriteGenerator';

// --- Utils ---

const checkCollision = (rect1: {x: number, y: number, w: number, h: number}, rect2: {x: number, y: number, w: number, h: number}) => {
  return (rect1.x < rect2.x + rect2.w &&
          rect1.x + rect1.w > rect2.x &&
          rect1.y < rect2.y + rect2.h &&
          rect1.y + rect1.h > rect2.y);
};

const hasLineOfSight = (p1: Point, p2: Point, walls: Point[], maxDist: number = 180) => {
    const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    if (dist > maxDist) return false; 

    const steps = Math.ceil(dist / (TILE_SIZE / 2));
    const dx = (p2.x - p1.x) / steps;
    const dy = (p2.y - p1.y) / steps;

    for (let i = 0; i < steps; i++) {
        const checkX = p1.x + dx * i;
        const checkY = p1.y + dy * i;
        
        for (const wall of walls) {
            if (checkX > wall.x && checkX < wall.x + TILE_SIZE &&
                checkY > wall.y && checkY < wall.y + TILE_SIZE) {
                return false; 
            }
        }
    }
    return true;
};

// Check if target is in enemy's vision cone (110 degrees)
const isInVisionCone = (enemy: Npc, target: Point, fov: number = 110): boolean => {
    // Calculate angle from enemy to target
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const angleToTarget = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Get enemy's facing direction angle
    let facingAngle = 0;
    switch(enemy.direction) {
        case Direction.RIGHT: facingAngle = 0; break;
        case Direction.DOWN: facingAngle = 90; break;
        case Direction.LEFT: facingAngle = 180; break;
        case Direction.UP: facingAngle = -90; break;
    }
    
    // Calculate angle difference
    let angleDiff = angleToTarget - facingAngle;
    // Normalize to -180 to 180
    while (angleDiff > 180) angleDiff -= 360;
    while (angleDiff < -180) angleDiff += 360;
    
    // Check if within FOV
    return Math.abs(angleDiff) <= fov / 2;
};

// --- Level Configuration ---
interface LevelConfig {
    girls: number;
    eyes: number;
    obstacleDensity: number; // 0 to 1
    timeLimit: number; // Not used anymore, kept for compatibility
    items?: number; // Number of items to spawn
    bushes?: number; // Number of bushes to spawn
    isBossLevel?: boolean; // Special boss mode
}

const getLevelConfig = (level: number): LevelConfig => {
    // Boss level - special mode
    if (level === 25) {
        return { 
            girls: 3, 
            eyes: 0, // No eyes in boss level
            obstacleDensity: 0.25, 
            timeLimit: 9999,
            items: 3,
            bushes: 4,
            isBossLevel: true
        };
    }
    
    // Regular levels 1-24 - REDUCED eye enemies, more focus on girls
    switch(level) {
        case 1: return { girls: 1, eyes: 0, obstacleDensity: 0.03, timeLimit: 9999, items: 1, bushes: 2 };
        case 2: return { girls: 2, eyes: 0, obstacleDensity: 0.08, timeLimit: 9999, items: 1, bushes: 2 };
        case 3: return { girls: 2, eyes: 0, obstacleDensity: 0.12, timeLimit: 9999, items: 1, bushes: 3 };
        case 4: return { girls: 3, eyes: 0, obstacleDensity: 0.15, timeLimit: 9999, items: 2, bushes: 3 };
        case 5: return { girls: 3, eyes: 1, obstacleDensity: 0.18, timeLimit: 9999, items: 2, bushes: 4 };
        case 6: return { girls: 4, eyes: 1, obstacleDensity: 0.20, timeLimit: 9999, items: 2, bushes: 4 };
        case 7: return { girls: 4, eyes: 1, obstacleDensity: 0.23, timeLimit: 9999, items: 2, bushes: 5 };
        case 8: return { girls: 5, eyes: 1, obstacleDensity: 0.26, timeLimit: 9999, items: 3, bushes: 5 };
        case 9: return { girls: 5, eyes: 2, obstacleDensity: 0.29, timeLimit: 9999, items: 3, bushes: 6 };
        case 10: return { girls: 6, eyes: 2, obstacleDensity: 0.32, timeLimit: 9999, items: 3, bushes: 6 };
        case 11: return { girls: 6, eyes: 2, obstacleDensity: 0.33, timeLimit: 9999, items: 3, bushes: 6 };
        case 12: return { girls: 7, eyes: 2, obstacleDensity: 0.34, timeLimit: 9999, items: 3, bushes: 7 };
        case 13: return { girls: 7, eyes: 2, obstacleDensity: 0.35, timeLimit: 9999, items: 4, bushes: 7 };
        case 14: return { girls: 8, eyes: 3, obstacleDensity: 0.36, timeLimit: 9999, items: 4, bushes: 8 };
        case 15: return { girls: 8, eyes: 3, obstacleDensity: 0.37, timeLimit: 9999, items: 4, bushes: 8 };
        case 16: return { girls: 9, eyes: 3, obstacleDensity: 0.38, timeLimit: 9999, items: 4, bushes: 8 };
        case 17: return { girls: 9, eyes: 3, obstacleDensity: 0.39, timeLimit: 9999, items: 4, bushes: 9 };
        case 18: return { girls: 10, eyes: 4, obstacleDensity: 0.40, timeLimit: 9999, items: 5, bushes: 9 };
        case 19: return { girls: 10, eyes: 4, obstacleDensity: 0.40, timeLimit: 9999, items: 5, bushes: 10 };
        case 20: return { girls: 11, eyes: 4, obstacleDensity: 0.40, timeLimit: 9999, items: 5, bushes: 10 };
        case 21: return { girls: 11, eyes: 5, obstacleDensity: 0.40, timeLimit: 9999, items: 5, bushes: 10 };
        case 22: return { girls: 12, eyes: 5, obstacleDensity: 0.40, timeLimit: 9999, items: 5, bushes: 11 };
        case 23: return { girls: 12, eyes: 5, obstacleDensity: 0.40, timeLimit: 9999, items: 5, bushes: 11 };
        case 24: return { girls: 12, eyes: 6, obstacleDensity: 0.40, timeLimit: 9999, items: 6, bushes: 12 };
        default: return { 
            girls: Math.min(15, Math.floor(level/2) + 3), 
            eyes: Math.min(8, Math.floor(level/4) + 1), // Reduced from /2.5+2 to /4+1 for less enemy focus
            obstacleDensity: 0.40, 
            timeLimit: 9999,
            items: 3,
            bushes: Math.min(12, 8 + Math.floor(level / 10))
        };
    }
};

interface GameEngineProps {
  inputs: React.MutableRefObject<Record<string, boolean>>;
  actionTrigger: React.MutableRefObject<boolean>;
  onScoreUpdate: (score: number) => void;
  onGameOver: () => void;
  onWin: () => void;
  onLevelChange?: (level: number) => void;
  onPauseRequest?: () => void;
  isPaused?: boolean;
  initialLevel?: number;
}

export const GameEngine: React.FC<GameEngineProps> = ({ 
  inputs, 
  actionTrigger, 
  onScoreUpdate, 
  onGameOver, 
  onWin, 
  onLevelChange,
  onPauseRequest,
  isPaused = false,
  initialLevel = 1 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Game State Refs
  const playerRef = useRef<Player>({
      id: 0, x: 100, y: 100, width: 16, height: 16, speed: PLAYER_SPEED,
      direction: Direction.DOWN, state: EntityState.IDLE, frameTimer: 0, currentFrame: 0, isSpamming: false,
      mana: 0, maxMana: 100, confusedTimer: 0, inBush: false, upgrades: []
  });
  const npcsRef = useRef<Npc[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const wallsRef = useRef<Point[]>([]);
  const bushesRef = useRef<Bush[]>([]);
  const activeLinksRef = useRef<Point[]>([]); 
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const timeLeftRef = useRef(0); // In Frames
  const spritesRef = useRef<Record<string, HTMLImageElement>>({});
  const speedBoostTimerRef = useRef(0); // Frames remaining for speed boost
  const stealthTimerRef = useRef(0); // Frames remaining for stealth
  const [collectedMessage, setCollectedMessage] = useState<string | null>(null);
  const [showUpgradeMenu, setShowUpgradeMenu] = useState(false);
  const [upgradeOptions, setUpgradeOptions] = useState<Upgrade[]>([]);

  const spawnSplat = (x: number, y: number, color: string = '#ffffff') => {
    for (let i = 0; i < 20; i++) {
        particlesRef.current.push({
            x: x + 8,
            y: y + 8,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 40 + Math.random() * 20,
            maxLife: 60,
            size: 2 + Math.random() * 4,
            color: color
        });
    }
  };

  const getAllUpgrades = (): Upgrade[] => {
    return [
      {
        type: UpgradeType.LYNRASK_NEVER,
        rarity: UpgradeRarity.RARE,
        name: 'Lynrask Never',
        description: 'Gjer at det går mykje fortare å bli ferdig',
        icon: '⚡'
      },
      {
        type: UpgradeType.BUSK_WOOKIE,
        rarity: UpgradeRarity.EPIC,
        name: 'Busk-Wookie',
        description: 'Gjer det vanskelegare å bli oppdaga',
        icon: '🌿'
      },
      {
        type: UpgradeType.EKSPLOSIV_AVGANG,
        rarity: UpgradeRarity.LEGENDARY,
        name: 'Eksplosiv Avgang',
        description: 'Ekstrem fart, men høg risiko',
        icon: '💥'
      },
      {
        type: UpgradeType.SPEED_BOOST,
        rarity: UpgradeRarity.COMMON,
        name: 'Raskare Føter',
        description: 'Gå 20% raskare',
        icon: '👟'
      },
      {
        type: UpgradeType.HEALTH_REGEN,
        rarity: UpgradeRarity.COMMON,
        name: 'Rask Bedring',
        description: 'Kom deg raskare etter å bli oppdaga',
        icon: '❤️'
      },
      {
        type: UpgradeType.TIME_EXTENSION,
        rarity: UpgradeRarity.RARE,
        name: 'Meir Tid',
        description: 'Få 30 sekund ekstra tid',
        icon: '⏰'
      }
    ];
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const generateUpgradeOptions = (): Upgrade[] => {
    const allUpgrades = getAllUpgrades();
    const player = playerRef.current;
    
    // Filter out already obtained upgrades
    const availableUpgrades = allUpgrades.filter(u => !player.upgrades.includes(u.type));
    
    if (availableUpgrades.length === 0) {
      // If all upgrades are obtained, still show options but they won't add new effects
      // This keeps the game flow consistent - player must choose to proceed
      return shuffleArray(allUpgrades).slice(0, 3);
    }
    
    // Use Fisher-Yates shuffle and take up to 3
    const shuffled = shuffleArray(availableUpgrades);
    return shuffled.slice(0, Math.min(3, shuffled.length));
  };

  const applyUpgrade = (upgrade: Upgrade) => {
    const player = playerRef.current;
    
    // Add upgrade to player's list
    if (!player.upgrades.includes(upgrade.type)) {
      player.upgrades.push(upgrade.type);
    }
    
    // Apply immediate effects
    switch(upgrade.type) {
      case UpgradeType.LYNRASK_NEVER:
        // Increases charge rate - handled in update loop
        break;
      case UpgradeType.BUSK_WOOKIE:
        // Makes detection harder - handled in detection logic
        break;
      case UpgradeType.EKSPLOSIV_AVGANG:
        // Extreme speed but higher detection range
        player.speed *= 2;
        break;
      case UpgradeType.SPEED_BOOST:
        // Multiplicative stacking for speed boosts
        player.speed *= 1.2;
        break;
      case UpgradeType.HEALTH_REGEN:
        // Reduces confusion timer - handled passively
        break;
      case UpgradeType.TIME_EXTENSION:
        timeLeftRef.current += 30 * FPS;
        break;
    }
    
    // Close menu and continue to next level
    setShowUpgradeMenu(false);
    advanceToNextLevel();
  };

  const initLevel = (level: number) => {
    const config = getLevelConfig(level);
    const mapWidth = Math.floor(VIRTUAL_WIDTH / TILE_SIZE);
    const mapHeight = Math.floor(VIRTUAL_HEIGHT / TILE_SIZE);
    
    timeLeftRef.current = config.timeLimit * FPS;
    wallsRef.current = [];
    itemsRef.current = [];
    
    // Outer Walls
    for (let x = 0; x < mapWidth; x++) {
        wallsRef.current.push({ x: x * TILE_SIZE, y: 0 });
        wallsRef.current.push({ x: x * TILE_SIZE, y: (mapHeight - 1) * TILE_SIZE });
    }
    for (let y = 1; y < mapHeight - 1; y++) {
        wallsRef.current.push({ x: 0, y: y * TILE_SIZE });
        wallsRef.current.push({ x: (mapWidth - 1) * TILE_SIZE, y: y * TILE_SIZE });
    }

    // Procedural Obstacles based on density
    const innerTilesX = mapWidth - 2;
    const innerTilesY = mapHeight - 2;
    const totalInnerTiles = innerTilesX * innerTilesY;
    const obstacleCount = Math.floor(totalInnerTiles * config.obstacleDensity);

    const availableSpots: Point[] = [];
    for (let x = 1; x < mapWidth - 1; x++) {
        for (let y = 1; y < mapHeight - 1; y++) {
            // Leave spawn area clear
            if (x < 4 && y < 4) continue;
            availableSpots.push({ x: x * TILE_SIZE, y: y * TILE_SIZE });
        }
    }

    for (let i = availableSpots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableSpots[i], availableSpots[j]] = [availableSpots[j], availableSpots[i]];
    }

    for (let i = 0; i < obstacleCount; i++) {
        if (i < availableSpots.length) {
             wallsRef.current.push(availableSpots[i]);
        }
    }

    playerRef.current.x = TILE_SIZE * 2;
    playerRef.current.y = TILE_SIZE * 2;
    playerRef.current.mana = 50; // Start with half mana (Hades-style)
    playerRef.current.confusedTimer = 0;

    npcsRef.current = [];
    
    // Boss level - spawn boss enemy
    if (config.isBossLevel) {
        spawnNpc(0, NpcType.BOSS_EYE, true);
    } else {
        // Spawn Girls
        for (let i = 0; i < config.girls; i++) {
            spawnNpc(i, NpcType.GIRL_BLONDE);
        }
        
        // Spawn Eye Enemies
        for (let i = 0; i < config.eyes; i++) {
            spawnNpc(config.girls + i, NpcType.ENEMY_EYE);
        }
    }
    
    // Spawn Items
    if (config.items && config.items > 0) {
        const itemSpots = availableSpots.slice(obstacleCount, obstacleCount + config.items * 3);
        for (let i = 0; i < config.items; i++) {
            if (i < itemSpots.length) {
                const spot = itemSpots[i * 3];
                let itemType = Math.floor(Math.random() * 5) as ItemType;
                
                // More lore notes in later levels
                if (level > 10 && Math.random() > 0.6) {
                    itemType = ItemType.LORE_NOTE;
                }
                
                itemsRef.current.push({
                    id: i,
                    x: spot.x + TILE_SIZE / 4,
                    y: spot.y + TILE_SIZE / 4,
                    width: 12,
                    height: 12,
                    type: itemType,
                    collected: false,
                    message: itemType === ItemType.LORE_NOTE ? getLoreMessage(level) : undefined
                });
            }
        }
    }
    
    // Spawn Bushes
    bushesRef.current = [];
    if (config.bushes && config.bushes > 0) {
        const bushSpots = availableSpots.slice(
            obstacleCount + (config.items || 0) * 3, 
            obstacleCount + (config.items || 0) * 3 + config.bushes * 4
        );
        for (let i = 0; i < config.bushes; i++) {
            if (i * 4 < bushSpots.length) {
                const spot = bushSpots[i * 4];
                bushesRef.current.push({
                    x: spot.x + TILE_SIZE / 2,
                    y: spot.y + TILE_SIZE / 2,
                    radius: BUSH_RADIUS
                });
            }
        }
    }
  };

  const getLoreMessage = (level: number): string => {
    const messages = [
      "Det snakkes om ein mystisk skikkelse...",
      "Auge ser alt, men ikkje bak seg.",
      "Dei kallar han Runkemannen.",
      "Ein gong var han normal, no er han legende.",
      "Jentene veit ikkje kva dei vekker.",
      "Augo følgjer deg, pass deg.",
      "I skyggane ligg sanninga.",
      "Kven er du eigentleg?",
      "Nivå 25... der ventar noko stort.",
      "Augo har ein svakheit - dei ser berre framover.",
      "Makt kjem med ansvar... eller?",
      "Ein ekte mester sniker utan å bli sett.",
      "Tida er di største fiende.",
      "Kanskje du er helten? Kanskje skurken?",
      "Det finst ein større plan.",
      "Augo vokterer hemmelege makter.",
      "Runkemannen er meir enn eit rykte.",
      "Nærmar du deg slutten, nærmar sanninga seg.",
      "Kva skjer når alle nivå er fullført?",
      "Dette er berre byrjinga."
    ];
    return messages[Math.min(level - 1, messages.length - 1)];
  };

  const spawnNpc = (id: number, forcedType?: NpcType, isBoss: boolean = false) => {
    let nx, ny;
    let safe = false;
    let attempts = 0;
    
    while (!safe && attempts < 100) {
        attempts++;
        nx = Math.random() * (VIRTUAL_WIDTH - 64) + 32;
        ny = Math.random() * (VIRTUAL_HEIGHT - 64) + 32;
        
        const dist = Math.sqrt(Math.pow(nx - playerRef.current.x, 2) + Math.pow(ny - playerRef.current.y, 2));
        if (dist < 150) continue;

        let inWall = false;
        for (const w of wallsRef.current) {
            if (nx > w.x - 16 && nx < w.x + TILE_SIZE && ny > w.y - 16 && ny < w.y + TILE_SIZE) {
                inWall = true;
                break;
            }
        }
        if (!inWall) safe = true;
    }

    let type = forcedType !== undefined ? forcedType : (Math.random() > 0.5 ? NpcType.GIRL_BLONDE : NpcType.GIRL_REDHEAD);
    if (type === NpcType.GIRL_BLONDE && Math.random() > 0.5) type = NpcType.GIRL_REDHEAD;

    npcsRef.current.push({
        id: id,
        x: nx,
        y: ny,
        width: isBoss ? 24 : 16,
        height: isBoss ? 24 : 16,
        speed: isBoss ? NPC_RUN_SPEED * 0.7 : NPC_WALK_SPEED,
        direction: Math.floor(Math.random() * 4),
        state: EntityState.IDLE,
        frameTimer: 0,
        currentFrame: 0,
        alerted: false,
        reactionTimer: 0,
        type: type,
        isBoss: isBoss
    });
  }

  const update = () => {
    const player = playerRef.current;
    activeLinksRef.current = [];
    
    // --- Mana Decay Mechanic (Hades-style) ---
    // Player loses mana over time when not charging
    // Game over if mana reaches 0
    
    // 0. Status Effects
    // Health Regen upgrade - recover from confusion faster
    const hasHealthRegen = player.upgrades.includes(UpgradeType.HEALTH_REGEN);
    if (player.confusedTimer > 0) {
        player.confusedTimer -= hasHealthRegen ? 2 : 1;
    }
    
    // Handle active item timers
    if (speedBoostTimerRef.current > 0) {
        speedBoostTimerRef.current--;
        if (speedBoostTimerRef.current === 0) {
            player.speed = PLAYER_SPEED;
        }
    }
    
    if (stealthTimerRef.current > 0) {
        stealthTimerRef.current--;
        if (stealthTimerRef.current === 0 && player.confusedTimer < 0) {
            player.confusedTimer = 0;
        }
    }

    // 1. Player Movement
    let dx = 0;
    let dy = 0;
    
    const moveSpeed = player.speed;
    const confusionMultiplier = player.confusedTimer > 0 ? -1 : 1;

    if (inputs.current['UP']) dy -= moveSpeed * confusionMultiplier;
    if (inputs.current['DOWN']) dy += moveSpeed * confusionMultiplier;
    if (inputs.current['LEFT']) dx -= moveSpeed * confusionMultiplier;
    if (inputs.current['RIGHT']) dx += moveSpeed * confusionMultiplier;

    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    // Collisions
    player.x += dx;
    for (const w of wallsRef.current) {
        if (checkCollision({x: player.x, y: player.y, w: player.width, h: player.height}, {x: w.x, y: w.y, w: TILE_SIZE, h: TILE_SIZE})) {
            player.x -= dx;
            dx = 0;
        }
    }
    player.y += dy;
    for (const w of wallsRef.current) {
        if (checkCollision({x: player.x, y: player.y, w: player.width, h: player.height}, {x: w.x, y: w.y, w: TILE_SIZE, h: TILE_SIZE})) {
            player.y -= dy;
            dy = 0;
        }
    }
    
    player.x = Math.max(TILE_SIZE, Math.min(player.x, VIRTUAL_WIDTH - TILE_SIZE * 2));
    player.y = Math.max(TILE_SIZE, Math.min(player.y, VIRTUAL_HEIGHT - TILE_SIZE * 2));

    // Check if player is in a bush
    player.inBush = false;
    for (const bush of bushesRef.current) {
        const distToBush = Math.sqrt(
            Math.pow(player.x + player.width / 2 - bush.x, 2) + 
            Math.pow(player.y + player.height / 2 - bush.y, 2)
        );
        if (distToBush < bush.radius) {
            player.inBush = true;
            break;
        }
    }

    // Animation & Direction
    if (dx !== 0 || dy !== 0) {
        player.state = EntityState.WALK;
        if (Math.abs(dx) > Math.abs(dy)) {
            player.direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
        } else {
            player.direction = dy > 0 ? Direction.DOWN : Direction.UP;
        }
        player.frameTimer++;
        if (player.frameTimer > 8) {
            player.currentFrame = (player.currentFrame + 1) % 4; // 4 Frames
            player.frameTimer = 0;
        }
    } else {
        player.state = EntityState.IDLE;
        player.currentFrame = 0;
    }

    // 2. NPC Logic & Charging
    let chargingSourceCount = 0;

    for (let i = npcsRef.current.length - 1; i >= 0; i--) {
        const npc = npcsRef.current[i];
        
        const isEnemy = npc.type === NpcType.ENEMY_EYE || npc.type === NpcType.BOSS_EYE;
        const isBoss = npc.isBoss || false;
        const visionRange = isBoss ? 280 : (isEnemy ? 220 : 180);
        
        const dist = Math.sqrt(Math.pow(npc.x - player.x, 2) + Math.pow(npc.y - player.y, 2));
        
        // Check line of sight first
        let canSeePlayer = hasLineOfSight(
            {x: player.x + 8, y: player.y + 8}, 
            {x: npc.x + 8, y: npc.y + 8}, 
            wallsRef.current,
            visionRange
        );
        
        // BUSH STEALTH: If player is in bush, enemies can't see them unless they're charging
        // Check if player is charging by seeing if there are active links
        const isCharging = chargingSourceCount > 0 || activeLinksRef.current.length > 0;
        const hasBuskWookie = player.upgrades.includes(UpgradeType.BUSK_WOOKIE);
        
        if (isEnemy && player.inBush) {
            // Base bush stealth: invisible when not charging
            if (!isCharging) {
                canSeePlayer = false;
            } else if (hasBuskWookie) {
                // Busk-Wookie upgrade: even when charging, 70% chance to remain hidden
                if (Math.random() < 0.7) {
                    canSeePlayer = false;
                }
            }
        }
        
        // For enemies, also check 110-degree vision cone
        if (isEnemy && canSeePlayer) {
            canSeePlayer = isInVisionCone(npc, {x: player.x + 8, y: player.y + 8}, isBoss ? 360 : 110);
        }
        
        // --- CHARGING MECHANIC (Only Girls) ---
        // Player CANNOT charge if distracted (confusedTimer > 0)
        // Girls stop charging if player is moving or too close (they notice)
        const playerIsMoving = dx !== 0 || dy !== 0;
        const tooCloseToCharge = dist < DETECTION_PROXIMITY_THRESHOLD;
        const girlsNoticed = playerIsMoving && tooCloseToCharge;
        
        // Apply Lynrask Never upgrade - faster charging
        const hasLynraskNever = player.upgrades.includes(UpgradeType.LYNRASK_NEVER);
        const chargeMultiplier = hasLynraskNever ? 2.5 : 1.0;
        
        if (!isEnemy && !npc.alerted && canSeePlayer && dist < CHARGE_DISTANCE && player.confusedTimer <= 0 && !girlsNoticed) {
            player.mana = Math.min(player.maxMana, player.mana + CHARGE_RATE * chargeMultiplier);
            activeLinksRef.current.push({x: npc.x + 8, y: npc.y + 8});
            chargingSourceCount++;
        }

        // --- ALERT LOGIC ---
        // Busk-Wookie upgrade makes detection distance smaller (already declared above)
        const detectionModifier = hasBuskWookie ? 0.7 : 1.0;
        
        // Eksplosiv Avgang increases detection range (high risk)
        const hasEksplosivAvgang = player.upgrades.includes(UpgradeType.EKSPLOSIV_AVGANG);
        const riskModifier = hasEksplosivAvgang ? 1.5 : 1.0;
        
        const alertDistance = isEnemy ? visionRange * detectionModifier * riskModifier : 40 * detectionModifier; 
        
        if (canSeePlayer && dist < alertDistance) {
            if (!npc.alerted) {
                npc.alerted = true;
                npc.reactionTimer = 20; 
                npc.state = EntityState.SURPRISED;
            }
        }
        
        if (isEnemy && canSeePlayer) {
             if (!npc.alerted) {
                npc.alerted = true;
                npc.reactionTimer = 10;
                npc.state = EntityState.SURPRISED;
             }
        }

        if (npc.alerted) {
            if (npc.reactionTimer > 0) {
                npc.reactionTimer--;
                npc.state = EntityState.SURPRISED;
            } else {
                npc.state = isEnemy ? EntityState.CHASE : EntityState.RUN_AWAY;
            }
        } else {
             if (Math.random() < 0.005) {
                 npc.alerted = false;
                 npc.state = EntityState.IDLE;
             }
             if (npc.state !== EntityState.IDLE) npc.state = EntityState.WALK;
        }

        // --- MOVEMENT ---
        let ndx = 0;
        let ndy = 0;

        if (npc.state === EntityState.RUN_AWAY || npc.state === EntityState.CHASE) {
            npc.speed = isBoss ? NPC_RUN_SPEED * 1.2 : NPC_RUN_SPEED;
            if (isEnemy && !isBoss) npc.speed = NPC_RUN_SPEED * 0.9;
            
            const angle = Math.atan2(npc.y - player.y, npc.x - player.x);
            
            if (npc.state === EntityState.CHASE) {
                ndx = -Math.cos(angle) * npc.speed;
                ndy = -Math.sin(angle) * npc.speed;
            } else {
                ndx = Math.cos(angle) * npc.speed;
                ndy = Math.sin(angle) * npc.speed;
            }
            
            if (Math.abs(ndx) > Math.abs(ndy)) {
                npc.direction = ndx > 0 ? Direction.RIGHT : Direction.LEFT;
            } else {
                npc.direction = ndy > 0 ? Direction.DOWN : Direction.UP;
            }

        } else if (npc.state === EntityState.WALK) {
            npc.speed = isBoss ? NPC_RUN_SPEED * 0.5 : NPC_WALK_SPEED;
            // SMARTER AI: Don't change direction as often (lower probability)
            // This makes them patrol lines rather than jitter
            if (Math.random() < 0.01) npc.direction = Math.floor(Math.random() * 4);
            
            // Occasionally stop to look around (idle)
            if (Math.random() < 0.01) npc.state = EntityState.IDLE;

            if (npc.direction === Direction.UP) ndy = -npc.speed;
            if (npc.direction === Direction.DOWN) ndy = npc.speed;
            if (npc.direction === Direction.LEFT) ndx = -npc.speed;
            if (npc.direction === Direction.RIGHT) ndx = npc.speed;
        } else if (npc.state === EntityState.IDLE) {
            // If idle, occasionaly start walking again
            if (Math.random() < 0.02) npc.state = EntityState.WALK;
        }

        npc.x += ndx;
        let hitWall = false;
        for (const w of wallsRef.current) {
            if (checkCollision({x: npc.x, y: npc.y, w: npc.width, h: npc.height}, {x: w.x, y: w.y, w: TILE_SIZE, h: TILE_SIZE})) {
                npc.x -= ndx;
                hitWall = true;
            }
        }
        npc.y += ndy;
        for (const w of wallsRef.current) {
             if (checkCollision({x: npc.x, y: npc.y, w: npc.width, h: npc.height}, {x: w.x, y: w.y, w: TILE_SIZE, h: TILE_SIZE})) {
                npc.y -= ndy;
                hitWall = true;
            }
        }
        if (hitWall && npc.state === EntityState.WALK) {
             // If hitting wall, definitely change direction
             npc.direction = (npc.direction + 1) % 4;
        }

        npc.x = Math.max(TILE_SIZE, Math.min(npc.x, VIRTUAL_WIDTH - TILE_SIZE * 2));
        npc.y = Math.max(TILE_SIZE, Math.min(npc.y, VIRTUAL_HEIGHT - TILE_SIZE * 2));

        if (ndx !== 0 || ndy !== 0) {
             npc.frameTimer++;
             const threshold = (npc.state === EntityState.RUN_AWAY || npc.state === EntityState.CHASE) ? 4 : 8;
             if (npc.frameTimer > threshold) {
                 npc.currentFrame = (npc.currentFrame + 1) % 4;
                 npc.frameTimer = 0;
             }
        } else {
            npc.currentFrame = 0;
        }

        // --- INTERACTIONS ---
        if (isEnemy) {
            // Invincibility Logic: Touching enemy doesn't kill, it distracts
            // But not if player has stealth cloak (negative confusedTimer)
            const touchDist = isBoss ? 20 : 12;
            if (dist < touchDist && player.confusedTimer >= 0) { 
                if (player.confusedTimer <= 0) {
                    player.confusedTimer = isBoss ? 240 : 180; // Boss stuns longer
                    player.mana = 0; // Penalty: Lose all mana
                    spawnSplat(player.x, player.y, '#ff00ff'); 
                }
            }
        } else {
            // NEW MECHANIC: Rapid pressing to deplete charge
            if (actionTrigger.current && player.mana > 0 && dist < RUNK_DISTANCE) {
                // Deplete mana by a fixed amount per press
                player.mana = Math.max(0, player.mana - RUNK_DEPLETION_RATE);
                
                // SUCCESS when mana reaches 0
                if (player.mana === 0) {
                    player.isSpamming = true;
                    scoreRef.current += 500;
                    onScoreUpdate(scoreRef.current);
                    spawnSplat(npc.x, npc.y, '#ffffff');
                    npcsRef.current.splice(i, 1);
                    // Refill mana after successful completion
                    player.mana = player.maxMana;
                }
                actionTrigger.current = false; 
            }
        }
    };

    // MANA DECAY MECHANIC (Hades-style)
    // Player loses mana when not charging from girls
    // Game over when mana reaches 0
    // Note: confusedTimer <= 0 means normal state (not confused)
    // confusedTimer > 0 = confused/distracted (no decay as additional punishment)
    // confusedTimer < 0 = stealth mode (no decay as reward)
    if (chargingSourceCount === 0 && player.confusedTimer <= 0) {
        player.mana = Math.max(0, player.mana - MANA_DECAY_RATE);
        
        // GAME OVER when mana depletes
        if (player.mana === 0) {
            onGameOver();
            return;
        }
    }

    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.vx *= 0.9; 
        p.vy *= 0.9;
        if (p.life <= 0) particlesRef.current.splice(i, 1);
    }

    // Item Collection
    for (let i = itemsRef.current.length - 1; i >= 0; i--) {
        const item = itemsRef.current[i];
        if (item.collected) continue;
        
        const dist = Math.sqrt(Math.pow(item.x - player.x, 2) + Math.pow(item.y - player.y, 2));
        if (dist < 20) {
            item.collected = true;
            spawnSplat(item.x, item.y, '#ffff00');
            
            // Apply item effects
            switch(item.type) {
                case ItemType.HEALTH_BOOST:
                    player.confusedTimer = Math.max(0, player.confusedTimer - 60);
                    break;
                case ItemType.SPEED_BOOST:
                    player.speed = PLAYER_SPEED * 1.3;
                    speedBoostTimerRef.current = 5 * FPS; // 5 seconds
                    break;
                case ItemType.STEALTH_CLOAK:
                    // Temporarily make player invisible to enemies
                    player.confusedTimer = -120; // Negative = invincible
                    stealthTimerRef.current = 3 * FPS; // 3 seconds
                    break;
                case ItemType.TIME_FREEZE:
                    // Not used anymore, give mana boost instead
                    player.mana = Math.min(player.maxMana, player.mana + 30);
                    break;
                case ItemType.SUNGLASSES:
                    // Sunglasses: Reduce detection range for enemies temporarily
                    stealthTimerRef.current = Math.max(stealthTimerRef.current, 8 * FPS); // 8 seconds of reduced detection (extend if already active)
                    // Stealth is represented by negative confusedTimer values
                    // More negative = longer stealth duration
                    if (player.confusedTimer >= 0) {
                        // Not in stealth, activate it
                        player.confusedTimer = -SUNGLASSES_STEALTH_TIME;
                    } else {
                        // Already in stealth, extend it (more negative = longer)
                        player.confusedTimer -= SUNGLASSES_STEALTH_TIME;
                    }
                    break;
                case ItemType.LORE_NOTE:
                    if (item.message) {
                        setCollectedMessage(item.message);
                        setTimeout(() => setCollectedMessage(null), 4000);
                    }
                    break;
            }
        }
    }

    if (actionTrigger.current) {
         actionTrigger.current = false;
         setTimeout(() => playerRef.current.isSpamming = false, 100);
    }

    const targetsRemaining = npcsRef.current.filter(n => 
        n.type !== NpcType.ENEMY_EYE && n.type !== NpcType.BOSS_EYE
    ).length;
    if (targetsRemaining === 0) {
        // Show upgrade menu before advancing to next level
        const options = generateUpgradeOptions();
        setUpgradeOptions(options);
        setShowUpgradeMenu(true);
    }
  };
  
  const advanceToNextLevel = () => {
      levelRef.current++;
      if (onLevelChange) onLevelChange(levelRef.current);
      initLevel(levelRef.current);
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    const tilesImg = spritesRef.current['tiles'];
    if (tilesImg) {
        for(let y=0; y<Math.ceil(VIRTUAL_HEIGHT/TILE_SIZE); y++) {
             for(let x=0; x<Math.ceil(VIRTUAL_WIDTH/TILE_SIZE); x++) {
                 ctx.drawImage(tilesImg, 32, 0, 32, 32, x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
             }
        }
        for (const w of wallsRef.current) {
            ctx.drawImage(tilesImg, 0, 0, 32, 32, w.x, w.y, TILE_SIZE, TILE_SIZE);
        }
    }

    // Draw Bushes (before entities so entities appear on top)
    for (const bush of bushesRef.current) {
        // Draw bush as green circle with darker center
        ctx.fillStyle = 'rgba(34, 139, 34, 0.6)'; // Forest green with transparency
        ctx.beginPath();
        ctx.arc(bush.x, bush.y, bush.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner darker circle for depth
        ctx.fillStyle = 'rgba(20, 100, 20, 0.4)';
        ctx.beginPath();
        ctx.arc(bush.x, bush.y, bush.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }

    const player = playerRef.current;
    if (activeLinksRef.current.length > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.2})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = -performance.now() / 10; 
        
        for (const p of activeLinksRef.current) {
            ctx.beginPath();
            ctx.moveTo(player.x + 8, player.y + 8);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Draw Items
    for (const item of itemsRef.current) {
        if (item.collected) continue;
        
        // Pulsing effect
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        
        // Different colors for different item types
        let color = '#ffff00';
        let symbol = '?';
        switch(item.type) {
            case ItemType.HEALTH_BOOST:
                color = '#ff0000';
                symbol = '+';
                break;
            case ItemType.SPEED_BOOST:
                color = '#00ffff';
                symbol = '»';
                break;
            case ItemType.STEALTH_CLOAK:
                color = '#8800ff';
                symbol = '◊';
                break;
            case ItemType.TIME_FREEZE:
                color = '#00ff00';
                symbol = '⏱';
                break;
            case ItemType.SUNGLASSES:
                color = '#000000';
                symbol = '🕶';
                break;
            case ItemType.LORE_NOTE:
                color = '#ffaa00';
                symbol = '📜';
                break;
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(item.x, item.y, item.width, item.height);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(symbol, item.x + item.width / 2, item.y + item.height - 2);
        
        ctx.globalAlpha = 1.0;
    }

    const entities = [playerRef.current, ...npcsRef.current].sort((a, b) => a.y - b.y);

    entities.forEach(ent => {
        let sprite = spritesRef.current['player'];
        let isPlayer = false;
        let isEnemy = false;
        
        if ('alerted' in ent) {
            const npc = ent as Npc;
            if (npc.type === NpcType.ENEMY_EYE || npc.type === NpcType.BOSS_EYE) {
                sprite = spritesRef.current['enemy_eye'];
                isEnemy = true;
            } else if (npc.type === NpcType.GIRL_REDHEAD) {
                sprite = spritesRef.current['npc_redhead'];
            } else {
                sprite = spritesRef.current['npc_blonde'];
            }
        } else {
            isPlayer = true;
        }

        if (sprite) {
            const frameW = 16;
            const frameH = 16;
            
            let row = 0;
            if (ent.direction === Direction.DOWN) row = 0;
            if (ent.direction === Direction.LEFT) row = 1;
            if (ent.direction === Direction.RIGHT) row = 2;
            if (ent.direction === Direction.UP) row = 3;

            // Flash player RED/Transparent if distracted (Damaged effect)
            // Make player semi-transparent when in bush
            // Confused state takes priority over bush transparency
            if (isPlayer && (ent as Player).confusedTimer > 0) {
                // Flickering visibility
                if (Math.floor(Date.now() / 50) % 2 === 0) {
                   ctx.globalAlpha = 0.3; // Very faint
                   ctx.globalCompositeOperation = "lighter"; // Additive blending for "shocked" look
                }
            } else if (isPlayer && (ent as Player).inBush) {
                ctx.globalAlpha = 0.5;
            }

            ctx.drawImage(sprite, 
                ent.currentFrame * frameW, row * frameH, frameW, frameH, 
                ent.x, ent.y, ent.width, ent.height
            );
            
            // Reset composite
            ctx.globalCompositeOperation = "source-over";
            ctx.globalAlpha = 1.0;

            if (!isPlayer && !isEnemy) {
                const npc = ent as Npc;
                if (npc.state === EntityState.SURPRISED) {
                     ctx.fillStyle = '#ff0000';
                     ctx.font = 'bold 16px monospace';
                     ctx.fillText('!', npc.x + 4, npc.y - 6);
                }
            } else if (isEnemy) {
                 const npc = ent as Npc;
                 if (npc.isBoss) {
                    // Boss indicator - crown
                    ctx.fillStyle = '#ffaa00';
                    ctx.font = 'bold 16px monospace';
                    ctx.fillText('♔', npc.x + 4, npc.y - 6);
                 } else if (npc.alerted) {
                    ctx.fillStyle = '#ff00aa';
                    ctx.font = 'bold 12px monospace';
                    ctx.fillText('!!', npc.x + 2, npc.y - 6);
                 }
            } else if (isPlayer) {
                 if ((ent as Player).isSpamming) {
                     ctx.strokeStyle = '#fff';
                     ctx.lineWidth = 2;
                     ctx.beginPath();
                     ctx.arc(ent.x + 8, ent.y + 8, 30, 0, Math.PI * 2);
                     ctx.stroke();
                 }
                 // REMOVED TEXT "DISTRACTED!"
            }
        }
    });

    particlesRef.current.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    // --- HUD ---
    
    // Mana Bar
    const barW = 100;
    const barH = 8;
    // Shake the bar if confused
    let bx = VIRTUAL_WIDTH / 2 - barW / 2;
    let by = VIRTUAL_HEIGHT - 20;
    
    if (player.confusedTimer > 0) {
        bx += (Math.random() - 0.5) * 6; // Violent shake
        by += (Math.random() - 0.5) * 6;
    }

    ctx.fillStyle = '#444';
    ctx.fillRect(bx, by, barW, barH);
    const fillPct = player.mana / player.maxMana;
    
    // Bar Logic: Damaged appearance
    if (player.confusedTimer > 0) {
        // "Broken" static effect
        ctx.fillStyle = '#551111'; // Dark red base
        ctx.fillRect(bx, by, barW, barH);
        // Draw static
        for(let i=0; i<10; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#ff0000' : '#000';
            ctx.fillRect(bx + Math.random()*barW, by, 2, barH);
        }
    } else {
        ctx.fillStyle = fillPct >= 1.0 ? '#fff' : '#4488ff'; 
        if (fillPct >= 1.0 && Math.floor(Date.now() / 100) % 2 === 0) ctx.fillStyle = '#ffff00'; 
        ctx.fillRect(bx, by, barW * fillPct, barH);
    }
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, barW, barH);
    
    // Only show text if NOT damaged
    if (player.confusedTimer < 0) {
        // Stealth mode indicator
        ctx.fillStyle = '#8800ff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("stealth", VIRTUAL_WIDTH/2, by - 4);
    } else if (player.confusedTimer <= 0) {
        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        let statusText = fillPct >= 1.0 ? "klar!" : "lader";
        ctx.fillText(statusText, VIRTUAL_WIDTH/2, by - 4);
    }

    // Level Info (Changed to "d" for depth like Hades)
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    const levelText = levelRef.current === 25 ? 'd25: boss' : `d${levelRef.current}`;
    ctx.fillText(levelText, 10, VIRTUAL_HEIGHT - 10);

    // Mana percentage (instead of timer)
    const manaPercent = Math.floor((player.mana / player.maxMana) * 100);
    ctx.textAlign = 'right';
    ctx.fillStyle = manaPercent < 20 ? '#ff0000' : '#fff';
    ctx.fillText(`${manaPercent}%`, VIRTUAL_WIDTH - 10, VIRTUAL_HEIGHT - 10);
    
    // Lore message display
    if (collectedMessage) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(10, VIRTUAL_HEIGHT / 2 - 30, VIRTUAL_WIDTH - 20, 60);
        ctx.fillStyle = '#ffaa00';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        
        // Word wrap the message
        const words = collectedMessage.split(' ');
        let line = '';
        let y = VIRTUAL_HEIGHT / 2 - 10;
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > VIRTUAL_WIDTH - 40 && i > 0) {
                ctx.fillText(line, VIRTUAL_WIDTH / 2, y);
                line = words[i] + ' ';
                y += 12;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, VIRTUAL_WIDTH / 2, y);
    }
  };

  const gameLoop = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (!isPaused && !showUpgradeMenu) {
      update();
    }
    draw(ctx);

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [isPaused, showUpgradeMenu]);

  useEffect(() => {
    spritesRef.current = loadSprites();
    levelRef.current = initialLevel;
    initLevel(initialLevel);
    
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, [gameLoop, initialLevel]);

  return (
    <div className="relative w-full h-full">
      <canvas 
          ref={canvasRef} 
          width={VIRTUAL_WIDTH} 
          height={VIRTUAL_HEIGHT}
          className="w-full h-full object-contain bg-black shadow-2xl"
      />
      
      {/* Upgrade Menu Overlay */}
      {showUpgradeMenu && upgradeOptions.length > 0 && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 z-50">
          <h2 className="text-2xl text-yellow-400 font-bold mb-2">Velg Oppgradering</h2>
          <p className="text-xs text-zinc-300 mb-6">Permanent boost for denne runnen</p>
          
          <div className="flex gap-3 flex-wrap justify-center max-w-full">
            {upgradeOptions.map((upgrade, index) => {
              const rarityColors = {
                [UpgradeRarity.COMMON]: 'border-zinc-500 bg-zinc-800/80',
                [UpgradeRarity.RARE]: 'border-blue-500 bg-blue-900/80',
                [UpgradeRarity.EPIC]: 'border-purple-500 bg-purple-900/80',
                [UpgradeRarity.LEGENDARY]: 'border-orange-500 bg-orange-900/80'
              };
              
              const rarityColor = rarityColors[upgrade.rarity];
              
              return (
                <button
                  key={index}
                  onClick={() => applyUpgrade(upgrade)}
                  className={`w-full max-w-[280px] p-4 border-2 ${rarityColor} rounded-lg hover:scale-105 transition-transform cursor-pointer`}
                >
                  <div className="text-3xl mb-2">{upgrade.icon}</div>
                  <div className="text-sm font-bold text-white mb-1">{upgrade.name}</div>
                  <div className="text-xs text-zinc-400 mb-2">{upgrade.rarity}</div>
                  <div className="text-xs text-zinc-200">{upgrade.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Clickable level indicator overlay */}
      {onPauseRequest && (
        <div 
          onClick={onPauseRequest}
          className="absolute bottom-2 left-2 cursor-pointer hover:opacity-80 transition-opacity"
          style={{ 
            width: '80px', 
            height: '20px',
            pointerEvents: 'auto'
          }}
        />
      )}
    </div>
  );
};