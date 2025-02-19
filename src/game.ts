import * as Phaser from 'phaser';

const WIDTH = 800;
const HEIGHT = 600;
const INSTRUCTIONS = [
  'Press J to play as Jelko (arrow keys)',
  'Press Y to play as Yane (arrow keys)',
  'Tap Jelko to play as Jelko (touch screen)',
  'Tap Yane to play as Yane (touch screen)',
  'Press V for VS play on Qwerty keyboard (WSAD and arrow keys)',
  'Press B for VS play on Azerty keyboard (ZSQD and arrow keys)',
  'Press H to reset highscore',
];
const PLAYER1 = 'player1';
const PLAYER2 = 'player2';
const TINTS = {
  2: 0x00ff00,
  1: 0xffa500,
  0: 0xff0000,
};

class Game extends Phaser.Scene {
  private centerTop: any;
  private tweenCenterTop: Phaser.Tweens.Tween;

  private player1: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private scoreText1: Phaser.GameObjects.Text;
  private score1: number;
  private lives1: number;
  private bombs1: Phaser.Physics.Arcade.Group;

  private player2: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private scoreText2: Phaser.GameObjects.Text;
  private score2: number;
  private lives2: number;
  private bombs2: Phaser.Physics.Arcade.Group;

  private highscore: {
    value: number;
    text: Phaser.GameObjects.Text;
  };

  private stars: Phaser.Physics.Arcade.Group;
  private gameState: 'GAMEOVER' | 'PLAYING';
  private gameMode: 'JELKO' | 'YANE' | 'VSQ' | 'VSA' | 'TOUCHJ' | 'TOUCHY';
  private instructionsText: Phaser.GameObjects.Text;
  private farts: (Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound)[] = [];

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wsadKeys: {
    W: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private zsqdKeys: {
    Z: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    Q: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private configKeys: {
    J: Phaser.Input.Keyboard.Key;
    Y: Phaser.Input.Keyboard.Key;
    V: Phaser.Input.Keyboard.Key;
    B: Phaser.Input.Keyboard.Key;
    H: Phaser.Input.Keyboard.Key;
  };
  private buttons: Phaser.GameObjects.Group;
  private buttonUp: Phaser.GameObjects.Image;
  private buttonDown: Phaser.GameObjects.Image;
  private buttonLeft: Phaser.GameObjects.Image;
  private buttonRight: Phaser.GameObjects.Image;

  preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('ball', 'assets/ball.png');
    this.load.image('elephant', 'assets/elephant.png');

    this.load.image('up', 'assets/up.png');
    this.load.image('down', 'assets/down.png');
    this.load.image('left', 'assets/left.png');
    this.load.image('right', 'assets/right.png');

    this.load.spritesheet('jelko', 'assets/jelko.png', {
      frameWidth: 32,
      frameHeight: 48,
    });
    this.load.spritesheet('yane', 'assets/yane.png', {
      frameWidth: 32,
      frameHeight: 48,
    });

    this.load.audio('fart1', 'assets/fart1.mp3');
    this.load.audio('fart2', 'assets/fart2.mp3');
    this.load.audio('fart3', 'assets/fart3.mp3');
  }

  create() {
    this.farts.push(this.sound.add('fart1'));
    this.farts.push(this.sound.add('fart2'));
    this.farts.push(this.sound.add('fart3'));

    const sky = this.add.image(WIDTH / 2, HEIGHT / 2, 'sky');
    sky.displayWidth = WIDTH;
    sky.displayHeight = HEIGHT;

    const platforms = this.physics.add.group({ immovable: true, allowGravity: false });
    const ground = platforms.create(WIDTH / 2, HEIGHT - 16, 'platform');
    ground.displayWidth = WIDTH;
    ground.refreshBody();
    const centerBottom = platforms.create(450, 450, 'platform');
    centerBottom.displayWidth = 150;
    centerBottom.refreshBody();
    const mini = platforms.create(575, 300, 'platform');
    mini.displayWidth = 37.5;
    mini.refreshBody();
    platforms.create(50, 300, 'platform');
    platforms.create(875, 225, 'platform');
    this.centerTop = platforms.create(400, 150, 'platform');
    this.centerTop.displayWidth = 150;
    this.centerTop.refreshBody();
    this.centerTop.setFrictionX(1);

    this.tweenCenterTop = this.tweens.addCounter({
      from: 100,
      to: -100,
      duration: 3000,
      ease: Phaser.Math.Easing.Sine.InOut,
      repeat: -1,
      yoyo: true,
      onUpdate: (tween, target) => {
        this.centerTop.setVelocityX(target.value);
      },
    });

    const localHighScore = parseInt(localStorage.getItem('highscore')) || 0;
    this.highscore = {
      value: localHighScore,
      text: this.add
        .text(WIDTH / 2, 16, `Highscore: ${localHighScore}`, {
          fontSize: '24px',
          color: '#000000',
        })
        .setOrigin(0.5, 0),
    };

    this.instructionsText = this.add
      .text(WIDTH / 2, 64, INSTRUCTIONS, {
        fontSize: '16px',
        color: '#000000',
        backgroundColor: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5, 0);

    this.player1 = this.physics.add.sprite(100, 400, 'yane', 5);
    this.player1.setName(PLAYER1);
    this.physics.add.collider(this.player1, platforms);
    this.createPlayerAnims(this.player1.name, 'yane');

    this.player2 = this.physics.add.sprite(700, 400, 'jelko');
    this.player2.setName(PLAYER2);
    this.physics.add.collider(this.player2, platforms);
    this.createPlayerAnims(this.player2.name, 'jelko');

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wsadKeys = this.input.keyboard.addKeys('W,S,A,D') as any;
    this.zsqdKeys = this.input.keyboard.addKeys('Z,S,Q,D') as any;
    this.configKeys = this.input.keyboard.addKeys('J,Y,V,B,H') as any;

    this.buttons = this.add.group();
    this.buttonUp = this.buttons.create(112, HEIGHT - 208, 'up');
    this.buttonDown = this.buttons.create(112, HEIGHT - 112, 'down');
    this.buttonLeft = this.buttons.create(48, HEIGHT - 160, 'left');
    this.buttonRight = this.buttons.create(172, HEIGHT - 160, 'right');
    this.buttons.setVisible(false);

    this.stars = this.physics.add.group({
      key: 'star',
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
      collideWorldBounds: true,
    });
    this.physics.add.collider(this.stars, platforms);
    this.physics.add.overlap(this.player1, this.stars, this.collectStar, null, this);
    this.physics.add.overlap(this.player2, this.stars, this.collectStar, null, this);
    this.stars.children.iterate((child: any) => child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)));
    this.stars.children.iterate((child: any) => child.disableBody(true, true));

    this.bombs1 = this.physics.add.group();
    this.bombs2 = this.physics.add.group();
    this.physics.add.collider(this.bombs1, platforms);
    this.physics.add.collider(this.bombs2, platforms);
    this.physics.add.overlap(this.player1, this.bombs2, this.hitBomb, null, this);
    this.physics.add.overlap(this.player2, this.bombs1, this.hitBomb, null, this);

    this.gameState = 'GAMEOVER';
  }

  private createPlayerAnims(playerName: string, spriteKey: string) {
    this.anims.create({
      key: playerName + '_left',
      frames: this.anims.generateFrameNumbers(spriteKey, { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: playerName + '_turn',
      frames: [{ key: spriteKey, frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: playerName + '_right',
      frames: this.anims.generateFrameNumbers(spriteKey, { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });
  }

  private collectStar(player, star) {
    star.disableBody(true, true);
    if (this.stars.countActive(true) === 0) {
      this.stars.children.iterate((child: any, index: number) => child.enableBody(true, 12 + index * 70, 0, true, true));
    }

    if (player.name === PLAYER1) {
      this.score1 += 10;
      this.scoreText1.setText([`Score: ${this.score1}`, `Lives: ${this.lives1}`]);
      this.updateHighscore(this.score1);
    } else {
      this.score2 += 10;
      this.scoreText2.setText([`Score: ${this.score2}`, `Lives: ${this.lives2}`]);
      this.updateHighscore(this.score2);
    }

    const numberOfBombsToThrow = Math.ceil((this.score1 + this.score2) / 120);
    for (let i = 0; i < numberOfBombsToThrow; i++) {
      this.throwBomb(player);
    }

    this.farts[Phaser.Math.Between(0, 2)].play();
  }

  private updateHighscore(score: number) {
    if (score > this.highscore.value) {
      localStorage.setItem('highscore', score.toString());
      this.highscore.value = score;
      this.highscore.text.setText(`Highscore: ${score}`);
    }
  }

  private throwBomb(player) {
    if (this.gameMode.includes('VS')) {
      const bombs = player.name === PLAYER1 ? this.bombs1 : this.bombs2;
      const bomb = bombs.create(player.x, player.y, player.name === PLAYER1 ? 'elephant' : 'ball');
      bomb.setVelocity(this.randomPosNegVelocity(Phaser.Math.Between(0, 1) === 0, 50, 150), -300);
      bomb.setBounce(0.9);
    } else {
      const bombs = player.name === PLAYER1 ? this.bombs2 : this.bombs1;
      const bombSpawnX = this.calculateBombSpawnXForSinglePlayer(player);
      const bomb = bombs.create(bombSpawnX, 16, Phaser.Math.Between(0, 1) ? 'elephant' : 'ball');
      bomb.setVelocity(this.randomPosNegVelocity(bombSpawnX < WIDTH / 2, 50, 150), 20);
      bomb.setBounce(0.9);
    }
  }

  private calculateBombSpawnXForSinglePlayer(player) {
    const farAwayFromPlayer = player.x + WIDTH / 2;
    const someRandomness = Phaser.Math.Between(-200, 200);
    const spawnX = farAwayFromPlayer + someRandomness;
    const fixOverflow = spawnX % WIDTH;

    return fixOverflow;
  }

  private randomPosNegVelocity(posNegCondition: boolean, randomMin: number, randomMax: number) {
    return posNegCondition ? Phaser.Math.Between(randomMin, randomMax) : Phaser.Math.Between(-randomMax, -randomMin);
  }

  private hitBomb(player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody, bomb: Phaser.Types.Physics.Arcade.GameObjectWithBody) {
    let livesLeft: number;
    if (player.name === PLAYER1) {
      this.lives1 += -1;
      this.scoreText1.setText([`Score: ${this.score1}`, `Lives: ${this.lives1}`]);
      livesLeft = this.lives1;
    } else {
      this.lives2 += -1;
      this.scoreText2.setText([`Score: ${this.score2}`, `Lives: ${this.lives2}`]);
      livesLeft = this.lives2;
    }
    player.setTint(TINTS[livesLeft]);

    if (livesLeft > 0) {
      bomb.destroy();
      return;
    }

    player.anims.play(player.name + '_turn');
    this.gameState = 'GAMEOVER';
    this.instructionsText.setVisible(true);

    if (this.gameMode === 'YANE' || this.gameMode === 'TOUCHY') {
      this.player2.enableBody(true, 700, HEIGHT - 32 - 24, true, true);
    }
    if (this.gameMode === 'JELKO' || this.gameMode === 'TOUCHJ') {
      this.player1.enableBody(true, 100, HEIGHT - 32 - 24, true, true);
    }

    this.physics.pause();
  }
  update() {
    if (this.gameState === 'GAMEOVER') {
      if (this.configKeys.J.isDown) {
        this.gameMode = 'JELKO';
        this.restartGame();
      }
      if (this.configKeys.Y.isDown) {
        this.gameMode = 'YANE';
        this.restartGame();
      }
      if (this.configKeys.V.isDown) {
        this.gameMode = 'VSQ';
        this.restartGame();
      }
      if (this.configKeys.B.isDown) {
        this.gameMode = 'VSA';
        this.restartGame();
      }
      if (this.input.activePointer.isDown) {
        if (this.player1.getBounds().contains(this.input.activePointer.downX, this.input.activePointer.downY)) {
          this.gameMode = 'TOUCHY';
          this.restartGame();
        }
        if (this.player2.getBounds().contains(this.input.activePointer.downX, this.input.activePointer.downY)) {
          this.gameMode = 'TOUCHJ';
          this.restartGame();
        }
      }
      if (this.configKeys.H.isDown) {
        localStorage.removeItem('highscore');
        this.highscore.value = 0;
        this.highscore.text.setText(`Highscore: ${this.highscore.value}`);
      }
      return;
    }

    this.bombs1.children.iterate((child: any) => (child.rotation += 0.05));
    this.bombs2.children.iterate((child: any) => (child.rotation += -0.05));

    if (this.gameMode === 'VSQ') {
      this.bindPlayerKeys(this.player1, {
        left: this.wsadKeys.A,
        right: this.wsadKeys.D,
        up: this.wsadKeys.W,
        down: this.wsadKeys.S,
      });
    } else if (this.gameMode === 'VSA') {
      this.bindPlayerKeys(this.player1, {
        left: this.zsqdKeys.Q,
        right: this.zsqdKeys.D,
        up: this.zsqdKeys.Z,
        down: this.zsqdKeys.S,
      });
    } else if (this.gameMode === 'YANE') {
      this.bindPlayerKeys(this.player1, {
        left: this.cursors.left,
        right: this.cursors.right,
        up: this.cursors.up,
        down: this.cursors.down,
      });
    } else if (this.gameMode === 'TOUCHY') {
      this.bindPlayerTouch(this.player1);
    }

    if (this.gameMode.includes('VS') || this.gameMode === 'JELKO') {
      this.bindPlayerKeys(this.player2, {
        left: this.cursors.left,
        right: this.cursors.right,
        up: this.cursors.up,
        down: this.cursors.down,
      });
    } else if (this.gameMode === 'TOUCHJ') {
      this.bindPlayerTouch(this.player2);
    }
  }

  private restartGame() {
    this.centerTop.enableBody(true, 400, 150, true, true);
    this.tweens.reset(this.tweenCenterTop);

    this.player1.enableBody(true, 100, HEIGHT - 32 - 24, true, true);
    this.player2.enableBody(true, 700, HEIGHT - 32 - 24, true, true);
    this.player1.clearTint();
    this.player2.clearTint();
    if (this.gameMode === 'YANE' || this.gameMode === 'TOUCHY') {
      this.player2.disableBody(true, true);
    }
    if (this.gameMode === 'JELKO' || this.gameMode === 'TOUCHJ') {
      this.player1.disableBody(true, true);
    }

    this.stars.children.iterate((child: any, index: number) => child.enableBody(true, 12 + index * 70, 0, true, true));
    this.bombs1.clear(true, true);
    this.bombs2.clear(true, true);

    this.score1 = 0;
    this.score2 = 0;
    this.lives1 = 3;
    this.lives2 = 3;
    this.scoreText1?.destroy();
    this.scoreText2?.destroy();
    if (['YANE', 'VSA', 'VSQ', 'TOUCHY'].includes(this.gameMode)) {
      this.scoreText1 = this.add.text(16, 16, [`Score: ${this.score1}`, `Lives: ${this.lives1}`], {
        fontSize: '32px',
        color: '#ffc0cb',
      });
    }
    if (['JELKO', 'VSA', 'VSQ', 'TOUCHJ'].includes(this.gameMode)) {
      this.scoreText2 = this.add.text(600, 16, [`Score: ${this.score2}`, `Lives: ${this.lives2}`], {
        fontSize: '32px',
        color: '#ffa500',
      });
    }

    if (this.gameMode.includes('TOUCH')) {
      this.buttons.setVisible(true);
    } else {
      this.buttons.setVisible(false);
    }

    this.gameState = 'PLAYING';
    this.instructionsText.setVisible(false);
    this.physics.resume();
  }

  private bindPlayerKeys(
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    keys: {
      left: Phaser.Input.Keyboard.Key;
      right: Phaser.Input.Keyboard.Key;
      up: Phaser.Input.Keyboard.Key;
      down: Phaser.Input.Keyboard.Key;
    },
  ) {
    if (keys.left.isDown) {
      player.setVelocityX(-160);
      player.anims.play(player.name + '_left', true);
    } else if (keys.right.isDown) {
      player.setVelocityX(160);
      player.anims.play(player.name + '_right', true);
    } else {
      player.setVelocityX(0);
      player.anims.play(player.name + '_turn');
    }

    if (keys.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }
    if (keys.down.isDown && !player.body.touching.down) {
      player.setVelocityY(600);
    }

    this.addPortalEffect(player);
  }

  private bindPlayerTouch(player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
    if (this.input.activePointer.isDown) {
      if (this.buttonLeft.getBounds().contains(this.input.activePointer.downX, this.input.activePointer.downY)) {
        player.setVelocityX(-160);
        player.anims.play(player.name + '_left', true);
      } else if (this.buttonRight.getBounds().contains(this.input.activePointer.downX, this.input.activePointer.downY)) {
        player.setVelocityX(160);
        player.anims.play(player.name + '_right', true);
      }

      if (this.buttonUp.getBounds().contains(this.input.activePointer.downX, this.input.activePointer.downY) && player.body.touching.down) {
        player.setVelocityY(-330);
      }
      if (this.buttonDown.getBounds().contains(this.input.activePointer.downX, this.input.activePointer.downY) && !player.body.touching.down) {
        player.setVelocityY(600);
      }

      this.addPortalEffect(player);
    } else {
      player.setVelocityX(0);
      player.anims.play(player.name + '_turn');
    }
  }

  private addPortalEffect(player: Phaser.Physics.Arcade.Sprite & { body: Phaser.Physics.Arcade.Body }) {
    if (player.x < 0) {
      player.setX(WIDTH);
    }
    if (player.x > WIDTH) {
      player.setX(0);
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: Game,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
};

new Phaser.Game(config);
