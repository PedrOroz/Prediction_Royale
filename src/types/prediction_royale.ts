/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/prediction_royale.json`.
 */
export type PredictionRoyale = {
  "address": "5JPjbA41yGiPKSFet9rW4C3zxKss8SEZBEknDG2NJi8D",
  "metadata": {
    "name": "predictionRoyale",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Survival prediction game on Solana"
  },
  "instructions": [
    {
      "name": "claimPrize",
      "docs": [
        "Winner claims the full prize pool. Closes room and player_data accounts."
      ],
      "discriminator": [
        157,
        233,
        139,
        121,
        246,
        62,
        234,
        235
      ],
      "accounts": [
        {
          "name": "winner",
          "writable": true,
          "signer": true
        },
        {
          "name": "room",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "room.creator",
                "account": "room"
              }
            ]
          }
        },
        {
          "name": "playerData",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "room"
              },
              {
                "kind": "account",
                "path": "winner"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "createRoom",
      "docs": [
        "Create a new game room. The creator must call join_room separately."
      ],
      "discriminator": [
        130,
        166,
        32,
        2,
        247,
        120,
        178,
        53
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "room",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "entryFee",
          "type": "u64"
        },
        {
          "name": "maxPlayers",
          "type": "u8"
        },
        {
          "name": "roundDuration",
          "type": "i64"
        },
        {
          "name": "isPrivate",
          "type": "bool"
        }
      ]
    },
    {
      "name": "initialize",
      "docs": [
        "Initialize the global game config. Called once by the authority."
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "joinRoom",
      "docs": [
        "Join an existing room. Pays entry fee and creates player data."
      ],
      "discriminator": [
        95,
        232,
        188,
        81,
        124,
        130,
        78,
        139
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "room",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "room.creator",
                "account": "room"
              }
            ]
          }
        },
        {
          "name": "playerData",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "room"
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "predict",
      "docs": [
        "Submit a prediction (Up or Down) for the current round."
      ],
      "discriminator": [
        254,
        114,
        112,
        244,
        37,
        49,
        32,
        128
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "room",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "room.creator",
                "account": "room"
              }
            ]
          }
        },
        {
          "name": "playerData",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "room"
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "direction",
          "type": {
            "defined": {
              "name": "predictionDirection"
            }
          }
        }
      ]
    },
    {
      "name": "resolveRound",
      "docs": [
        "Resolve the current round. Only the room creator (keeper) can call this.",
        "Reads the real SOL/USD price from the Pyth on-chain account.",
        "First call: sets initial price and starts the game.",
        "Subsequent calls: evaluates predictions, deducts lives.",
        "",
        "All active PlayerData accounts must be passed as remaining_accounts."
      ],
      "discriminator": [
        165,
        114,
        237,
        158,
        1,
        36,
        70,
        254
      ],
      "accounts": [
        {
          "name": "keeper",
          "writable": true,
          "signer": true
        },
        {
          "name": "room",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "room.creator",
                "account": "room"
              }
            ]
          }
        },
        {
          "name": "pythPriceUpdate"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "playerData",
      "discriminator": [
        197,
        65,
        216,
        202,
        43,
        139,
        147,
        128
      ]
    },
    {
      "name": "room",
      "discriminator": [
        156,
        199,
        67,
        27,
        222,
        23,
        185,
        94
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidAmount",
      "msg": "Invalid entry fee amount"
    },
    {
      "code": 6001,
      "name": "invalidMaxPlayers",
      "msg": "Max players must be between 2 and 10"
    },
    {
      "code": 6002,
      "name": "invalidRoundDuration",
      "msg": "Round duration must be between 30 and 600 seconds"
    },
    {
      "code": 6003,
      "name": "roomNotOpen",
      "msg": "Room is not open for joining"
    },
    {
      "code": 6004,
      "name": "roomFull",
      "msg": "Room is full"
    },
    {
      "code": 6005,
      "name": "alreadyJoined",
      "msg": "Player already joined this room"
    },
    {
      "code": 6006,
      "name": "gameNotInProgress",
      "msg": "Game is not in progress"
    },
    {
      "code": 6007,
      "name": "playerEliminated",
      "msg": "Player has been eliminated"
    },
    {
      "code": 6008,
      "name": "alreadyPredicted",
      "msg": "Already submitted prediction for this round"
    },
    {
      "code": 6009,
      "name": "roundExpired",
      "msg": "Round has expired, cannot predict"
    },
    {
      "code": 6010,
      "name": "roundNotEnded",
      "msg": "Round has not ended yet"
    },
    {
      "code": 6011,
      "name": "invalidPriceFeed",
      "msg": "Invalid Pyth price feed account"
    },
    {
      "code": 6012,
      "name": "stalePriceData",
      "msg": "Price data is stale"
    },
    {
      "code": 6013,
      "name": "priceConfidenceTooWide",
      "msg": "Price confidence interval too wide"
    },
    {
      "code": 6014,
      "name": "notEnoughPlayers",
      "msg": "Not enough players to start"
    },
    {
      "code": 6015,
      "name": "invalidRoomState",
      "msg": "Invalid room state for this operation"
    },
    {
      "code": 6016,
      "name": "gameNotResolved",
      "msg": "Game has not been resolved yet"
    },
    {
      "code": 6017,
      "name": "notWinner",
      "msg": "Only the winner can claim the prize"
    },
    {
      "code": 6018,
      "name": "unauthorized",
      "msg": "unauthorized"
    },
    {
      "code": 6019,
      "name": "mathOverflow",
      "msg": "Math overflow"
    },
    {
      "code": 6020,
      "name": "invalidPlayerAccount",
      "msg": "Invalid player account"
    },
    {
      "code": 6021,
      "name": "serializationError",
      "msg": "Serialization error"
    }
  ],
  "types": [
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "playerData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "room",
            "type": "pubkey"
          },
          {
            "name": "lives",
            "type": "u8"
          },
          {
            "name": "eliminated",
            "type": "bool"
          },
          {
            "name": "currentPrediction",
            "type": {
              "option": {
                "defined": {
                  "name": "predictionDirection"
                }
              }
            }
          },
          {
            "name": "predictionRound",
            "type": "u16"
          },
          {
            "name": "eliminationRound",
            "type": {
              "option": "u16"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "predictionDirection",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "up"
          },
          {
            "name": "down"
          }
        ]
      }
    },
    {
      "name": "room",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "entryFee",
            "type": "u64"
          },
          {
            "name": "maxPlayers",
            "type": "u8"
          },
          {
            "name": "roundDuration",
            "type": "i64"
          },
          {
            "name": "isPrivate",
            "type": "bool"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "roomStatus"
              }
            }
          },
          {
            "name": "currentRound",
            "type": "u16"
          },
          {
            "name": "roundEndTime",
            "type": "i64"
          },
          {
            "name": "totalPrize",
            "type": "u64"
          },
          {
            "name": "lastPrice",
            "type": "i64"
          },
          {
            "name": "winner",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "players",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "activePlayers",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "roomStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "open"
          },
          {
            "name": "inProgress"
          },
          {
            "name": "resolved"
          }
        ]
      }
    }
  ]
};
