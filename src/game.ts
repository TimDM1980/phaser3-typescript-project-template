import * as Phaser from 'phaser';

// TODO
// support AZERTY
// refactor: remove duplication, extract classes, ...
// groter veld / centreren / fullscreen / zoom afhankelijk van window size
// scenes
//  beginscherm met legende en keys en press J/Y/V to start
//  game-over scherm met winnaar en press space to play again

const WIDTH = 800;
const HEIGHT = 600;
const PLAYER1 = 'player1';
const PLAYER2 = 'player2';

class Game extends Phaser.Scene {
  private player1: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private scoreText1: Phaser.GameObjects.Text;
  private score1;
  private bombs1: Phaser.Physics.Arcade.Group;

  private player2: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private scoreText2: Phaser.GameObjects.Text;
  private score2;
  private bombs2: Phaser.Physics.Arcade.Group;

  private stars: Phaser.Physics.Arcade.Group;
  private gameState: 'GAMEOVER' | 'PLAYING';
  private gameMode: 'JELKO' | 'YANE' | 'VS';
  private farts: (Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound)[] = [];

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wsadKeys: {
    W: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private configKeys: {
    J: Phaser.Input.Keyboard.Key;
    Y: Phaser.Input.Keyboard.Key;
    V: Phaser.Input.Keyboard.Key;
  };

  preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('ball', 'assets/ball.png');
    this.load.image('elephant', 'assets/elephant.png');

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

    const platforms = this.physics.add.staticGroup();
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
    const centerTop = platforms.create(400, 150, 'platform');
    centerTop.displayWidth = 150;
    centerTop.refreshBody();

    this.player1 = this.physics.add.sprite(100, 400, 'yane', 5);
    this.player1.setCollideWorldBounds(true);
    this.player1.setName(PLAYER1);
    this.physics.add.collider(this.player1, platforms);
    this.createPlayerAnims(this.player1.name, 'yane');

    this.player2 = this.physics.add.sprite(700, 400, 'jelko');
    this.player2.setCollideWorldBounds(true);
    this.player2.setName(PLAYER2);
    this.physics.add.collider(this.player2, platforms);
    this.createPlayerAnims(this.player2.name, 'jelko');

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wsadKeys = this.input.keyboard.addKeys('W,S,A,D') as any;
    this.configKeys = this.input.keyboard.addKeys('J,Y,V') as any;

    this.stars = this.physics.add.group({
      key: 'star',
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
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

  private restartGame() {
    this.player1.enableBody(true, 100, HEIGHT - 32 - 24, true, true);
    this.player2.enableBody(true, 700, HEIGHT - 32 - 24, true, true);
    this.player1.clearTint();
    this.player2.clearTint();
    if (this.gameMode === 'YANE') {
      this.player2.disableBody(true, true);
    }
    if (this.gameMode === 'JELKO') {
      this.player1.disableBody(true, true);
    }

    this.stars.children.iterate((child: any) => child.enableBody(true, child.x, 0, true, true));
    this.bombs1.clear(true, true);
    this.bombs2.clear(true, true);

    this.score1 = 0;
    this.score2 = 0;
    this.scoreText1?.destroy();
    this.scoreText2?.destroy();
    if (['YANE', 'VS'].includes(this.gameMode)) {
      this.scoreText1 = this.add.text(16, 16, 'Score: 0', {
        fontSize: '32px',
        color: '#ff00a6',
      });
    }
    if (['JELKO', 'VS'].includes(this.gameMode)) {
      this.scoreText2 = this.add.text(600, 16, 'Score: 0', {
        fontSize: '32px',
        color: '#ff9900',
      });
    }

    this.gameState = 'PLAYING';
    this.physics.resume();
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
      this.stars.children.iterate((child: any) => child.enableBody(true, child.x, 0, true, true));
    }

    if (player.name === PLAYER1) {
      this.score1 += 10;
      this.scoreText1.setText('Score: ' + this.score1);
    } else {
      this.score2 += 10;
      this.scoreText2.setText('Score: ' + this.score2);
    }

    const numberOfBombsToThrow = Math.ceil((player.name === PLAYER1 ? this.score1 : this.score2) / 120);
    for (let i = 0; i < numberOfBombsToThrow; i++) {
      this.throwBomb(player);
    }

    this.farts[Phaser.Math.Between(0, 2)].play();
  }

  private throwBomb(player) {
    if (this.gameMode === 'VS') {
      const bombs = player.name === PLAYER1 ? this.bombs1 : this.bombs2;
      const bomb = bombs.create(player.x, player.y, player.name === PLAYER1 ? 'elephant' : 'ball');
      bomb.setVelocity(this.randomPosNegVelocity(Phaser.Math.Between(0, 1) === 0, 50, 150), -300);
      bomb.setBounce(0.9);
    } else {
      const bombs = player.name === PLAYER1 ? this.bombs2 : this.bombs1;
      const bomb = bombs.create(this.calculateBombSpawnXForSinglePlayer(player), 16, Phaser.Math.Between(0, 1) ? 'elephant' : 'ball');
      bomb.setVelocity(this.randomPosNegVelocity(player.x > WIDTH / 2, 50, 150), 20);
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

  private hitBomb(player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play(player.name + '_turn');
    this.gameState = 'GAMEOVER';
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
        this.gameMode = 'VS';
        this.restartGame();
      }
      return;
    }

    this.bombs1.children.iterate((child: any) => (child.rotation += 0.05));
    this.bombs2.children.iterate((child: any) => (child.rotation += 0.05));

    if (this.gameMode === 'VS') {
      this.bindPlayerKeys(this.player1, {
        left: this.wsadKeys.A,
        right: this.wsadKeys.D,
        up: this.wsadKeys.W,
        down: this.wsadKeys.S,
      });
    } else {
      this.bindPlayerKeys(this.player1, {
        left: this.cursors.left,
        right: this.cursors.right,
        up: this.cursors.up,
        down: this.cursors.down,
      });
    }
    this.bindPlayerKeys(this.player2, {
      left: this.cursors.left,
      right: this.cursors.right,
      up: this.cursors.up,
      down: this.cursors.down,
    });
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
  }
}

const config = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  zoom: 1.5,
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
