// This file creates HTMLImageElements from code to ensure assets always load.
// Graphics inspired by 16-bit handheld RPGs (LeafGreen style).

import { NpcType } from '../types';

const createPixelCanvas = (width: number, height: number): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  return c;
};

// Helper to draw outlined rects for that RPG look
const drawRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

// Helper to draw the Green Alien (Player) - Updated for RPG style
const drawAlien = (ctx: CanvasRenderingContext2D, frame: number, dir: number) => {
    const skin = '#78c850'; // Pokemon Grass Green
    const pants = '#304060';
    const outline = '#203020';
    
    const bounce = (frame === 1 || frame === 3) ? 1 : 0;
    
    // Outline Body
    drawRect(ctx, 4, 8+bounce, 8, 6, outline);
    drawRect(ctx, 1, 0+bounce, 14, 9, outline); // Head outline

    // Legs
    ctx.fillStyle = pants;
    if (dir === 0 || dir === 3) {
        drawRect(ctx, 5, 12, 2, 4, pants);
        drawRect(ctx, 9, 12, 2, 4, pants);
    } else {
        if (frame === 1) drawRect(ctx, 4, 11, 3, 5, pants); 
        else drawRect(ctx, 6, 12, 4, 4, pants);
    }

    // Body
    drawRect(ctx, 5, 8 + bounce, 6, 4, skin);

    // Head
    drawRect(ctx, 2, 1 + bounce, 12, 8, skin); 
    
    // Antennae
    drawRect(ctx, 1, 0 + bounce, 1, 3, skin);
    drawRect(ctx, 14, 0 + bounce, 1, 3, skin);

    // Face
    const eyeColor = '#222';
    if (dir === 0) { 
        drawRect(ctx, 3, 4 + bounce, 3, 3, eyeColor);
        drawRect(ctx, 10, 4 + bounce, 3, 3, eyeColor);
        // Shine
        drawRect(ctx, 3, 4 + bounce, 1, 1, '#fff');
        drawRect(ctx, 10, 4 + bounce, 1, 1, '#fff');
    } else if (dir === 1) { 
        drawRect(ctx, 3, 4 + bounce, 2, 3, eyeColor);
    } else if (dir === 2) { 
        drawRect(ctx, 11, 4 + bounce, 2, 3, eyeColor);
    }
};

// Beach Girl Sprite - Naked/Beach Style
const drawGirl = (ctx: CanvasRenderingContext2D, frame: number, dir: number, variation: number) => {
    const skin = '#ffe0d0';
    const skinShade = '#f0c0b0';
    const hair = variation === 0 ? '#f8d030' : '#d04020'; // Electric Yellow or Fire Red
    const outline = '#402010'; // Dark brown outline
    
    const bounce = (frame === 1 || frame === 3) ? 1 : 0;

    // Legs (skin-colored, naked)
    ctx.fillStyle = skin; 
    if (dir === 0 || dir === 3) {
        ctx.fillRect(6, 12, 2, 4);
        ctx.fillRect(9, 12, 2, 4);
        // Leg shading
        ctx.fillStyle = skinShade;
        ctx.fillRect(7, 13, 1, 3);
        ctx.fillRect(10, 13, 1, 3);
    } else {
         if (frame === 1) {
             ctx.fillStyle = skin;
             ctx.fillRect(4, 11, 3, 5);
             ctx.fillStyle = skinShade;
             ctx.fillRect(5, 12, 1, 4);
         } else {
             ctx.fillStyle = skin;
             ctx.fillRect(6, 12, 4, 4);
             ctx.fillStyle = skinShade;
             ctx.fillRect(7, 13, 2, 3);
         }
    }

    // Body (naked, skin-colored)
    drawRect(ctx, 5, 8 + bounce, 6, 5, skin);
    // Body shading
    drawRect(ctx, 6, 9 + bounce, 4, 4, skinShade);
    
    // Minimal bikini/censorship (tiny pixels)
    const bikiniColor = variation === 0 ? '#f06090' : '#4090e0';
    drawRect(ctx, 6, 10 + bounce, 4, 1, bikiniColor);
    
    // Head
    drawRect(ctx, 4, 2 + bounce, 8, 7, skin);

    // Hair
    drawRect(ctx, 3, 1 + bounce, 10, 4, hair); 
    drawRect(ctx, 2, 2 + bounce, 2, 6, hair);  
    drawRect(ctx, 12, 2 + bounce, 2, 6, hair); 

    // Ponytail (Bouncy & Highlighted)
    const highlight = variation === 0 ? '#fff080' : '#f08060';
    
    if (dir === 0) { // Front (Peeking)
        drawRect(ctx, 11, 2 + bounce, 4, 3, hair);
        drawRect(ctx, 12, 5 + bounce, 3, 4, hair);
    } else if (dir === 1) { // Left
        drawRect(ctx, 10, 2 + bounce, 3, 3, hair);
        drawRect(ctx, 11, 5 + bounce, 3, 5, hair);
    } else if (dir === 2) { // Right (Main view)
        drawRect(ctx, 2, 2 + bounce, 3, 3, hair);
        drawRect(ctx, 2, 2 + bounce, 1, 1, highlight); // Shine
        drawRect(ctx, 1, 5 + bounce, 3, 5, hair);
        drawRect(ctx, 2, 8 + bounce, 2, 2, '#b08020'); // Shadow
    } else if (dir === 3) { // Back
        drawRect(ctx, 6, 3 + bounce, 4, 3, hair);
        drawRect(ctx, 7, 6 + bounce, 2, 6, hair);
    }

    // Face features
    if (dir === 0) {
        drawRect(ctx, 5, 5 + bounce, 2, 2, '#222');
        drawRect(ctx, 9, 5 + bounce, 2, 2, '#222');
        drawRect(ctx, 4, 7 + bounce, 2, 1, '#faa');
        drawRect(ctx, 10, 7 + bounce, 2, 1, '#faa');
    } else if (dir === 1) {
        drawRect(ctx, 4, 5 + bounce, 2, 2, '#222');
    } else if (dir === 2) {
        drawRect(ctx, 10, 5 + bounce, 2, 2, '#222');
    }
};

const drawEyeEnemy = (ctx: CanvasRenderingContext2D, frame: number, dir: number) => {
    const float = Math.sin(frame * Math.PI) * 2;
    const cx = 8;
    const cy = 8 + float;
    
    // Box Body
    drawRect(ctx, cx - 6, cy - 6, 12, 12, '#a040a0'); // Poison Purple
    drawRect(ctx, cx - 4, cy - 4, 8, 8, '#d060d0'); // Lighter center

    // Legs/Lashes
    ctx.strokeStyle = '#201020';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 4); ctx.lineTo(cx - 7, cy - 8);
    ctx.moveTo(cx, cy - 5);     ctx.lineTo(cx, cy - 9);
    ctx.moveTo(cx + 4, cy - 4); ctx.lineTo(cx + 7, cy - 8);
    ctx.moveTo(cx - 4, cy + 4); ctx.lineTo(cx - 6, cy + 9);
    ctx.moveTo(cx, cy + 5);     ctx.lineTo(cx, cy + 10);
    ctx.moveTo(cx + 4, cy + 4); ctx.lineTo(cx + 6, cy + 9);
    ctx.stroke();

    // Eye
    let ex = cx;
    if (dir === 1) ex -= 2; 
    if (dir === 2) ex += 2; 

    // Sclera
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(ex, cy, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.stroke();

    // Pupil
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(ex, cy, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Glint
    drawRect(ctx, ex - 1, cy - 1, 1, 1, '#fff');
};

// --- LEAF GREEN STYLE TILES ---

const drawTree = (ctx: CanvasRenderingContext2D) => {
    // A beach rock/obstacle or palm tree
    
    // Sand background first
    drawFloor(ctx);

    // Beach Rock/Palm Tree
    const rockGray = '#909090';
    const rockDark = '#606060';
    const rockLight = '#b0b0b0';
    
    // Main Rock Body
    ctx.fillStyle = rockGray;
    ctx.beginPath();
    ctx.ellipse(16, 16, 10, 8, 0, 0, Math.PI*2);
    ctx.fill();
    
    // Shadow/depth
    ctx.fillStyle = rockDark;
    ctx.beginPath();
    ctx.ellipse(16, 18, 9, 6, 0, 0, Math.PI*2);
    ctx.fill();

    // Highlights
    ctx.fillStyle = rockLight;
    ctx.beginPath();
    ctx.ellipse(14, 13, 4, 3, 0, 0, Math.PI*2);
    ctx.fill();
    
    // Bottom shadow on sand
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(16, 24, 11, 4, 0, 0, Math.PI*2);
    ctx.fill();
};

// Beach/Sand Floor
const drawFloor = (ctx: CanvasRenderingContext2D) => {
    // Base Sand
    ctx.fillStyle = '#f0d090'; // Sandy beach color
    ctx.fillRect(0,0,32,32);
    
    // Texture (darker sand patches)
    ctx.fillStyle = '#d8b878'; 
    
    // Sand patch 1
    ctx.fillRect(4, 4, 3, 2);
    ctx.fillRect(6, 2, 2, 2);
    ctx.fillRect(8, 5, 2, 1);

    // Sand patch 2
    ctx.fillRect(20, 20, 2, 3);
    ctx.fillRect(22, 18, 3, 2);
    ctx.fillRect(24, 21, 2, 2);
    
    // Lighter highlights
    ctx.fillStyle = '#fffae8';
    ctx.fillRect(10, 10, 1, 1);
    ctx.fillRect(15, 25, 1, 1);
    ctx.fillRect(26, 8, 1, 1);
    
    // Subtle noise
    ctx.fillStyle = 'rgba(200,180,140,0.05)';
    ctx.fillRect(0,0,32,1);
    ctx.fillRect(0,0,1,32);
};

export const loadSprites = (): Record<string, HTMLImageElement> => {
  const sheets: Record<string, HTMLImageElement> = {};
  const frameW = 16;
  const frameH = 16;
  const cols = 4;
  const rows = 4;

  // Player
  const pCanvas = createPixelCanvas(frameW * cols, frameH * rows);
  const pCtx = pCanvas.getContext('2d');
  if (pCtx) {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            pCtx.save();
            pCtx.translate(col * frameW, row * frameH);
            drawAlien(pCtx, col, row);
            pCtx.restore();
        }
    }
  }
  const pImg = new Image();
  pImg.src = pCanvas.toDataURL();
  sheets['player'] = pImg;

  // NPC 1 (Blonde)
  const n1Canvas = createPixelCanvas(frameW * cols, frameH * rows);
  const n1Ctx = n1Canvas.getContext('2d');
  if (n1Ctx) {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            n1Ctx.save();
            n1Ctx.translate(col * frameW, row * frameH);
            drawGirl(n1Ctx, col, row, 0);
            n1Ctx.restore();
        }
    }
  }
  const n1Img = new Image();
  n1Img.src = n1Canvas.toDataURL();
  sheets['npc_blonde'] = n1Img;

  // NPC 2 (Redhead)
  const n2Canvas = createPixelCanvas(frameW * cols, frameH * rows);
  const n2Ctx = n2Canvas.getContext('2d');
  if (n2Ctx) {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            n2Ctx.save();
            n2Ctx.translate(col * frameW, row * frameH);
            drawGirl(n2Ctx, col, row, 1);
            n2Ctx.restore();
        }
    }
  }
  const n2Img = new Image();
  n2Img.src = n2Canvas.toDataURL();
  sheets['npc_redhead'] = n2Img;

  // Enemy (Eye)
  const eCanvas = createPixelCanvas(frameW * cols, frameH * rows);
  const eCtx = eCanvas.getContext('2d');
  if (eCtx) {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            eCtx.save();
            eCtx.translate(col * frameW, row * frameH);
            drawEyeEnemy(eCtx, col, row);
            eCtx.restore();
        }
    }
  }
  const eImg = new Image();
  eImg.src = eCanvas.toDataURL();
  sheets['enemy_eye'] = eImg;

  // Tiles (Tree & Grass)
  // Re-creating tile canvas to be 64x32 (2 tiles wide)
  const tCanvasFixed = createPixelCanvas(64, 32);
  const tCtxFixed = tCanvasFixed.getContext('2d');
  if (tCtxFixed) {
      drawTree(tCtxFixed); // x=0
      tCtxFixed.translate(32, 0);
      drawFloor(tCtxFixed); // x=32
  }
  
  const tImg = new Image();
  tImg.src = tCanvasFixed.toDataURL();
  sheets['tiles'] = tImg;

  return sheets;
};