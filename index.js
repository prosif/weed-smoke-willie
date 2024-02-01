const crypto = require('crypto');

const { Asset, Game, GameNode, Colors, Physics, Shapes, ShapeUtils, GeometryUtils } = require(process.env.SQUISH_PATH);
const COLORS = Colors.COLORS;

const levelThresholds = {
    1: 5000,
    2: 250000,
    3: 1000000,
    4: 9999999999999999
};

const fishVelFactors = {
    1: 1,
    2: 1.5,
    3: 2.5
};

const fishValues = {
    1: 5,
    2: 30,
    3: 2000
};

class WeedSmokeWillie extends Game {
    static metadata() {
        return {
            aspectRatio: {x: 16, y: 9},
            squishVersion: '1006',
            author: 'Joseph Garcia',
            thumbnail: 'f70e1e9e2b5ab072764949a6390a8b96',
            tickRate: 60,
            assets: {
                'background': new Asset({
                    id: '8c1043367014492950188a4792c91e37',
                    type: 'image'
                }),
                'boat_1_left': new Asset({
                    id: 'da3bb83675a47712d00202261840dda4',
                    type: 'image'
                }),
                'boat_1_right': new Asset({
                    id: 'b664212eece66934e76f25aaf2841314',
                    type: 'image'
                }),
                'boat_2_left': new Asset({
                    id: '1cc08364781f3f5ce640736e47549cd3',
                    type: 'image'
                }),
                'boat_2_right': new Asset({
                    id: '743beb7e892eb4741b61a7d2d1f25d0f',
                    type: 'image'
                }),
                'boat_3_left': new Asset({
                    id: 'fad5bd46015511cd2e0c8d3591c70a73',
                    type: 'image'
                }),
                'boat_3_right': new Asset({
                    id: '56cc2f4252fb70a2efaacefc2ae23527',
                    type: 'image'
                }),
                'load_1': new Asset({
                    id: 'd2a826fa84a6b9a7b7a4244cc13a7dbf',
                    type: 'image'
                }),
                'load_2': new Asset({
                    id: '7214cab68490676d2715e778c76b06e8',
                    type: 'image'
                }),
                'load_3': new Asset({
                    id: '96c01293e192152a0247d5ce75f052c6',
                    type: 'image'
                }),
                'fish_1_left': new Asset({
                    id: '1085ec5013bf3d6b90ab901b99b85832',
                    type: 'image'
                }),
                'fish_2_left': new Asset({
                    id: '11275cd9ec3bc49675f00fd564eafdba',
                    type: 'image'
                }),
                'fish_3_left': new Asset({
                    id: '2364f2fcb997129ca1b9404f4d91c0be',
                    type: 'image'
                }),
                'fish_1_right': new Asset({
                    id: 'a1c24442e89d919f2622caa6701a6b21',
                    type: 'image'
                }),
                'fish_2_right': new Asset({
                    id: '82be259af5d0a0ad6f80d07cdec404a5',
                    type: 'image'
                }),
                'fish_3_right': new Asset({
                    id: '0242ca9972961b6b68707abd635a0a53',
                    type: 'image'
                })  
            }
        };
    }

    constructor() {
        super();

        this.base = new GameNode.Shape({
            shapeType: Shapes.POLYGON,
            coordinates2d: ShapeUtils.rectangle(0, 0, 100, 100),
            fill: COLORS.WHITE
        });

        this.baseImage = new GameNode.Asset({
            coordinates2d: ShapeUtils.rectangle(0, 0, 100, 100),
            assetInfo: {
                'background': {
                    pos: {
                        x: 0, 
                        y: 0
                    },
                    size: {
                        x: 100,
                        y: 100
                    }
                }
            }
        });

        this.base.addChild(this.baseImage);

        this.fishLayer = new GameNode.Shape({
            shapeType: Shapes.POLYGON,
            coordinates2d: ShapeUtils.rectangle(0, 0, 100, 100),
        });

        this.willieLayer = new GameNode.Shape({
            shapeType: Shapes.POLYGON,
            coordinates2d: ShapeUtils.rectangle(0, 0, 100, 100)
        });

        this.scoreLayer = new GameNode.Shape({
            shapeType: Shapes.POLYGON,
            coordinates2d: ShapeUtils.rectangle(80, 0, 20, 20),
            fill: COLORS.HG_BLACK
        });

        this.willie = new GameNode.Shape({
            shapeType: Shapes.POLYGON,
            coordinates2d: ShapeUtils.rectangle(42.5, 0, 45, 45)
        });

        this.level = 1;

        this.cash = 100;
        this.total = 0;
        this.multiplier = 1;

        this.renderCash();
        this.renderTotal();
        this.renderMultiplier();

        this.renderWillie();

        this.keysDown = {};
        this.loads = {};
        this.fish = {};
        this.expiringNodes = {};

        this.willieLayer.addChild(this.willie);
        this.base.addChildren(this.fishLayer, this.willieLayer, this.scoreLayer);
    }

    handleKeyUp(player, key) {
        this.keysDown[key] = false;
    }

    renderFish() {
        for (let key in this.fish) {
            const fish = this.fish[key];
            const fishCoords = Object.assign([], fish.node.node.coordinates2d);
            const fishImage = fish.image;
            const assetKey = Object.keys(fish.image.node.asset)[0];
            const assetVal = Object.assign({}, fish.image.node.asset[assetKey]);
            assetVal.pos = {
                x: fishCoords[0][0],
                y: fishCoords[0][1]
            };
            
            fish.image.node.asset = {
                [assetKey]: assetVal
            }

        }
    }

    renderWillie() {
        const willieCoords = Object.assign([], this.willie.node.coordinates2d);
        const willieXLeft = willieCoords[0][0];
        const willieXRight = willieCoords[1][0];
        const willieYTop = willieCoords[0][1];
        if (this.willieImage) {
            let key = Object.keys(this.willieImage.node.asset)[0];
            
            if (this.willieImage.node.asset[key].pos.x !== willieXLeft) {
                const assetVal = Object.assign({}, this.willieImage.node.asset[key]);

                if (assetVal.pos.x > willieXLeft) {
                    key = `boat_${this.level}_left`;
                }
                
                if (assetVal.pos.x < willieXLeft) {
                    key = `boat_${this.level}_right`;
                }

                assetVal.pos.x = willieXLeft;
                
                this.willieImage.node.asset = {
                    [key]: assetVal
                };
            }

        } else {
            this.willieImage = new GameNode.Asset({
                coordinates2d: willieCoords,
                assetInfo: {
                    [`boat_${this.level}_left`]: {
                        pos: {
                            x: willieCoords[0][0], 
                            y: willieCoords[0][1]
                        },
                        size: {
                            x: willieCoords[1][0] - willieCoords[0][0],
                            y: willieCoords[2][1] - willieCoords[1][1]
                        }
                    }
                }
            });

            this.willie.addChild(this.willieImage);
        }
    }

    renderCash() {
        const textSize = (cash) => {
            if (cash < 1000) {
                return 4;
            } else if (cash < 100000) {
                return 3;
            } else {
                return 2;
            }
        };

        if (this.cashNode) {
            const newTextInfo = Object.assign({}, this.cashNode.node.text);
            newTextInfo.text = `$${this.cash}`;
            newTextInfo.size = textSize(this.cash);
            if (this.cash >= 1000000000) {
                newTextInfo.x = 20;
            }
            this.cashNode.node.text = newTextInfo;
        } else {
            this.cashNode = new GameNode.Text({
                textInfo: {
                    x: 85,
                    y: 1.5,
                    text: `$${this.cash}`,
                    color: COLORS.GREEN,
                    align: 'left',
                    size: textSize(this.cash)
                }
            });

            this.scoreLayer.addChild(this.cashNode);
        }
    };

    renderMultiplier() {
        const textSize = (val) => {
            if (val < 5) {
                return 1;
            } 
            if (val < 15) {
                return 2;
            }
            if (val < 25) {
                return 3;
            }
            return 4;
        };

        if (this.multiplierNode) {
            const newTextInfo = Object.assign({}, this.multiplierNode.node.text);
            newTextInfo.text = `x${this.multiplier}`;
            newTextInfo.size = textSize(this.multiplier);
            this.multiplierNode.node.text = newTextInfo;
        } else {
            this.multiplierNode = new GameNode.Text({
                textInfo: {
                    x: 92.5,
                    y: 12.5,
                    text: `x${this.multiplier}`,
                    color: COLORS.RED,
                    align: 'center',
                    size: textSize(this.multiplier)
                }
            });

            this.scoreLayer.addChild(this.multiplierNode);
        }
    };

    renderTotal() {
        if (this.totalNode) {
            const newTextInfo = Object.assign({}, this.totalNode.node.text);
            newTextInfo.text = `Total: $${this.total}`;
            this.totalNode.node.text = newTextInfo;
        } else {
            this.totalNode = new GameNode.Text({
                textInfo: {
                    x: 1,
                    y: 95,
                    text: `Total: $${this.total}`,
                    color: COLORS.BLACK,
                    align: 'left',
                    size: 1.5
                }
            });

            this.scoreLayer.addChild(this.totalNode);
        }
    };

    shouldSpawnFish() {
        const curFishCount = Object.keys(this.fish).length;


        if (this.level === 1) {
            return curFishCount < 6;
        }

        if (this.level === 2) {
            return curFishCount < 5;
        }

        if (this.level === 3) {
            return curFishCount < 4;
        }

        // if we're on level 4 or something broke fuck it
        return true;
        
    }

    drugCost() {
        if (this.level === 1) {
            return 2;
        }

        if (this.level === 2) {
            return 20;
        }

        if (this.level === 3) {
            return 1600;
        }

        if (this.level === 4) {
            return 1000000; // it costs a steamboat millie
        }
    }

    dealDrugs(fish) {
        this.lastHitTime = Date.now();
        const fishInfo = this.fish[fish.node.id];
        if (!fishInfo) {
            // i dont know how this happens?
            return;
        }
        const fishValue = fishValues[fishInfo.fishType];

        const fishCenterX = fish.node.coordinates2d[0][0] + ((fish.node.coordinates2d[1][0] - fish.node.coordinates2d[0][0]) / 2);
        const fishCenterY = fish.node.coordinates2d[0][1] + ((fish.node.coordinates2d[2][1] - fish.node.coordinates2d[1][1]) / 2);

        const profit = (this.multiplier * fishValue);
        this.cash += profit;
        this.total += profit;

        if (this.cash >= levelThresholds[this.level]) {
            this.level++;
            this.renderWillie();
        }

        this.renderCash();
        this.renderTotal();
        this.renderMultiplier();

        const revenueText = new GameNode.Text({
            textInfo: {
                x: fishCenterX,
                y: fishCenterY + 5,
                text: `+$${fishValue * this.multiplier}`,
                align: 'center',
                size: 2,
                color: COLORS.GREEN
            }
        });

        const now = Date.now();

        this.expiringNodes[revenueText.node.id] = {
            node: revenueText,
            expireTime: now + 1000,
            parent: this.base
        };
        
        this.base.addChildren(revenueText);
    }

    kill() {
        const deadText = new GameNode.Text({
            textInfo: {
                x: 50,
                y: 45,
                text: `Weedsmoke Willie has perished`,
                align: 'center',
                size: 5,
                color: COLORS.BLACK
            }
        });

        this.base.addChild(deadText);

        this.dead = true;
    }

    tick() {
        if (this.dead) {
            return;
        }
        const now = Date.now();

        if (this.shouldMoveLeft || this.keysDown['ArrowLeft'] || this.keysDown['a']) {
            this.moveNode(this.willie, 'left');
        }

        if (this.shouldMoveRight || this.keysDown['ArrowRight'] || this.keysDown['d']) {
            this.moveNode(this.willie, 'right');
        }

        if ((this.shouldDropLoad || this.keysDown[' ']) && (!this.lastLoad || this.lastLoad < (now - 500))) {
            this.dropLoad();
            this.lastLoad = now;
        }

        if ((!this.lastSpawnedFish || this.lastSpawnedFish < (now - 1250)) && this.shouldSpawnFish()) {
            this.spawnFish();
            this.lastSpawnedFish = now;
        }

        const loadKeys = Object.keys(this.loads);
        for (let i in loadKeys) {
            const key = loadKeys[i];
            const cur = this.loads[key];
            
            const fishCollisions = GeometryUtils.checkCollisions(this.fishLayer, cur.node, (node) => node.node.id !== this.fishLayer.node.id && node.node.text == null);
            
            const collided = fishCollisions.length > 0;

            if (collided) {
                this.multiplier += 1;
                this.dealDrugs(fishCollisions[0]);
            }

            if (collided || cur.pathIndex >= cur.path.length) {
                this.willieLayer.removeChild(cur.node.id);
                const toFree = this.loads[cur.node.id];
                delete this.loads[cur.node.id];
                if (!collided) {
                    this.multiplier = 1;
                    this.renderMultiplier();
                    if (this.cash < 0 && Object.keys(this.loads).length === 0) {
                        this.kill();
                    }
                } else {
                    if (this.cash < 0 && Object.keys(this.loads).length === 0) {
                        this.kill();
                    }
                }

                for (let i = 0; i < fishCollisions.length; i++) {
                    const collidingFish = fishCollisions[i];
                    delete this.fish[collidingFish.node.id];
                    this.fishLayer.removeChild(collidingFish.node.id);
                }

            } else {
                const coords = cur.node.node.coordinates2d;

                const nodeWidth = coords[1][0] - coords[0][0];
                const nodeHeight = coords[2][1] - coords[1][1];

                const newCoords = ShapeUtils.rectangle(cur.path[cur.pathIndex][0], cur.path[cur.pathIndex][1], nodeWidth, nodeHeight);
                cur.node.node.coordinates2d = newCoords;

                const newAssetVal = Object.assign({}, cur.image.node.asset);
                const assetKey = Object.keys(newAssetVal)[0];
                newAssetVal[assetKey].pos = {
                    x: newCoords[0][0],
                    y: newCoords[0][1]
                };
                cur.node.node.asset = newAssetVal;

                cur.pathIndex++;
            }
        }

        const fishKeys = Object.keys(this.fish);
        for (let i in fishKeys) {
            const key = fishKeys[i];
            const cur = this.fish[key];

            if (cur.pathIndex >= cur.path.length) {
                this.fishLayer.removeChild(cur.node.id);
                const toFree = this.fish[cur.node.id];
                delete this.fish[cur.node.id];
            } else {
                const coords = cur.node.node.coordinates2d;

                const nodeWidth = coords[1][0] - coords[0][0];
                const nodeHeight = coords[2][1] - coords[1][1];

                const newCoords = ShapeUtils.rectangle(cur.path[cur.pathIndex][0], cur.path[cur.pathIndex][1], nodeWidth, nodeHeight);
                cur.node.node.coordinates2d = newCoords;

                cur.pathIndex++;
            }
        }
        
        const expiringKeys = Object.keys(this.expiringNodes);
        for (let i in expiringKeys) {
            const key = expiringKeys[i];
            const cur = this.expiringNodes[key];
            if (cur.expireTime <= now) {
                cur.parent.removeChild(cur.node.id);
                const toFree = this.expiringNodes[cur.node.id];
                delete this.expiringNodes[cur.node.id];
            }
        }

        if ((this.lastHitTime < now - 3500) && this.multiplier > 1) {
            this.multiplier = 1;
            this.renderMultiplier();
        }

        this.renderWillie();
        this.renderFish();
        this.base.node.onStateChange();
    }

    dropLoad() {
        const now = Date.now();
        const cost = this.drugCost();
        this.cash -= cost;

        this.renderCash();

        const willieCenterX = this.willie.node.coordinates2d[0][0] + ((this.willie.node.coordinates2d[1][0] - this.willie.node.coordinates2d[0][0]) / 2);
        const willieBottomY = this.willie.node.coordinates2d[2][1] - 4; // buffer to account for fish close to boat
 
        const costText = new GameNode.Text({
            textInfo: {
                x: willieCenterX,
                y: willieBottomY,
                text: `-$${cost}`,
                align: 'center',
                size: 2,
                color: COLORS.RED
            }
        });

       const newLoad = new GameNode.Shape({
            shapeType: Shapes.POLYGON,
            coordinates2d: ShapeUtils.rectangle(willieCenterX, willieBottomY, 5, 5),
            fill: COLORS.GRAY
        });

        const imageKey = `load_${this.level}`;

        const loadImage = new GameNode.Asset({
            coordinates2d: ShapeUtils.rectangle(willieCenterX, willieBottomY, 5, 5),
            assetInfo: {
                [imageKey]: {
                    pos: {
                        x: willieCenterX,
                        y: willieBottomY
                    },
                    size: {
                        x: 5,
                        y: 5 
                    }
                }
            }
        }); 

        const loadPath = Physics.getPath(willieCenterX, willieBottomY, 0, .35, 100, 95); // 100 - height of load

        this.loads[newLoad.node.id] = {
            node: newLoad,
            path: loadPath,
            pathIndex: 0,
            image: loadImage
        }

        this.expiringNodes[costText.node.id] = {
            node: costText,
            expireTime: now + 1000,
            parent: this.base
        };

        newLoad.addChild(loadImage);

        this.willieLayer.addChild(newLoad);
        this.base.addChildren(costText);
    }

    spawnFish() {
        const fishWidth = 14;
        const fishHeight = 14;
        const fishType = this.random(1, Math.min(this.level, 3));

        const fishVelFactor = fishVelFactors[fishType];

        const spawnLeft = this.random(0, 100) < 50;
        const randYStart = this.random(35, 100 - fishHeight);
        const randYEnd = this.random(35, 100 - fishHeight);
        const fishX = spawnLeft ? 0 : (100 - fishWidth);
        const fish = new GameNode.Shape({
            shapeType: Shapes.POLYGON,
            coordinates2d: ShapeUtils.rectangle(fishX, randYStart, fishWidth, fishHeight),
        });

        const imageKey = spawnLeft ? `fish_${fishType}_right` : `fish_${fishType}_left`;

        const fishImage = new GameNode.Asset({
            coordinates2d: ShapeUtils.rectangle(fishX, randYStart, fishWidth, fishHeight),
            assetInfo: {
                [imageKey]: {
                    pos: {
                        x: fishX,
                        y: randYStart
                    },
                    size: {
                        x: fishWidth,
                        y: fishHeight
                    }
                }
            }
        });

        const baseXVel = 0.1;
        const baseYVel = 0.005;

        const fishXVel = (spawnLeft ? 1 : -1) * ((fishVelFactor * baseXVel) + this.random(0, 1) / 4);

        // make it move a lil up or down for fun
        const fishYVel = Math.random(0, 1) === 1 ? -1 : 1 * baseYVel;

        // since we add random y velocity, let fish potentially wander off screen if they spawn at the edge
        const fuzzyBuf = 1.5;
        const fishPath = Physics.getPath(fishX, randYStart, fishXVel, fishYVel, 100 - fishWidth, 100 - fishHeight + fuzzyBuf);//spawnLeft ? .1 : -.1, (randYEnd - randYStart) / 100, 100, 100 - fishHeight); 

        this.fish[fish.node.id] = {
            node: fish,
            path: fishPath,
            pathIndex: 0,
            image: fishImage,
            fishType
        };

        fish.addChild(fishImage);

        this.fishLayer.addChild(fish);
    }

    random(min, max) {
        // https://stackoverflow.com/questions/4959975/generate-random-number-between-two-numbers-in-javascript/57954429#57954429
        return min + (max -  min + 1) * crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32 | 0;
    }

    moveNode(node, dir, dist = .5) {
        const coords = node.node.coordinates2d;

        let newX = coords[0][0];
        let newY = coords[0][1];
        
        // assume rectangle
        const nodeWidth = coords[1][0] - coords[0][0];
        const nodeHeight = coords[2][1] - coords[1][1];

        if (dir === 'up') {
            if (newY - dist < 0) {
                newY = 0;
            } else {
                newY -= dist;
            }
        } 

        if (dir === 'down') {
            if (newY + nodeWidth + dist <= 100) {
                newY += dist;
            } else {
                newY = 100 - nodeHeight;//player.size.y;
            }
        } 

        if (dir === 'left') {
            if (newX - dist < 0) {
                newX = 0;
            } else {
                newX -= dist;
            }
        } 

        if (dir === 'right') {
            if (newX + nodeWidth + dist <= 100) {
                newX += dist;
            } else {
                newX = 100 - nodeWidth;//player.size.x;
            }
        } 

        //const wouldBeCollisions = GeometryUtils.checkCollisions(this.base, {node: {coordinates2d: ShapeUtils.rectangle(newX, newY, 10, 17)}}, (node) => {
        //    return node.node.id !== this.base.node.id && node.node.id !== player.node.id;
        //});

        //if (wouldBeCollisions.length == 0) {
        const newCoords = ShapeUtils.rectangle(newX, newY, nodeWidth, nodeHeight);
        node.node.coordinates2d = newCoords;
        //}
    }

    handleGamepadInput(playerId, gamepadInput) {
        if (gamepadInput.input.buttons.FACE_1.pressed) {
            this.keysDown[' '] = true;
        } else {
            this.keysDown[' '] = false;
        }

        if (gamepadInput.input.sticks.STICK_1_X.value < 0) {
            this.keysDown['a'] = true;
        } else {
            this.keysDown['a'] = false;
        }


        if (gamepadInput.input.sticks.STICK_1_X.value > 0) {
            this.keysDown['d'] = true;
        } else {
            this.keysDown['d'] = false;
        }


    }

    handleKeyDown(player, key) {
        this.keysDown[key] = true;
    }

    getLayers() {
        return [{root: this.base}];
    }
}

module.exports = WeedSmokeWillie;
