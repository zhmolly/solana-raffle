export type SolanaRaffle = {
  "version": "0.1.0",
  "name": "solana_raffle",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "vault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "globalAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "updateSetting",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "newAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "globalAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "addWhitelist",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "collection",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "removeWhitelist",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "collection",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "createRaffle",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "splMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "raffleAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idx",
          "type": "u32"
        },
        {
          "name": "totalSupply",
          "type": "u32"
        },
        {
          "name": "price",
          "type": "u64"
        },
        {
          "name": "startDate",
          "type": "u64"
        },
        {
          "name": "endDate",
          "type": "u64"
        }
      ]
    },
    {
      "name": "addPrize",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "raffleAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idx",
          "type": "u32"
        }
      ]
    },
    {
      "name": "addPrizePnft",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "raffleAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "delegateRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authorizationRules",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sysvarInstructions",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authorizationRulesProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idx",
          "type": "u32"
        }
      ]
    },
    {
      "name": "buyTicket",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "raffleAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "splMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idx",
          "type": "u32"
        },
        {
          "name": "uid",
          "type": {
            "array": [
              "u8",
              12
            ]
          }
        },
        {
          "name": "amount",
          "type": "u32"
        }
      ]
    },
    {
      "name": "withdrawRaffle",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "raffleAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "splMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idx",
          "type": "u32"
        }
      ]
    },
    {
      "name": "revealWinner",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "raffleAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "recentSlothashes",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idx",
          "type": "u32"
        }
      ]
    },
    {
      "name": "claimPrize",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "raffleAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "creatorTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "winnerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idx",
          "type": "u32"
        },
        {
          "name": "uid",
          "type": {
            "array": [
              "u8",
              12
            ]
          }
        }
      ]
    },
    {
      "name": "claimPrizePnft",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "raffleAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ownerTokenRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ownerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destTokenRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authorizationRules",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sysvarInstructions",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authorizationRulesProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idx",
          "type": "u32"
        },
        {
          "name": "uid",
          "type": {
            "array": [
              "u8",
              12
            ]
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "globalAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "vault",
            "type": "publicKey"
          },
          {
            "name": "totalRaffles",
            "type": "u32"
          },
          {
            "name": "wlCollections",
            "type": {
              "array": [
                "publicKey",
                10
              ]
            }
          },
          {
            "name": "reserved0",
            "type": "u128"
          },
          {
            "name": "reserved1",
            "type": "u128"
          },
          {
            "name": "reserved2",
            "type": "u128"
          },
          {
            "name": "reserved3",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "raffleAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "idx",
            "type": "u32"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "splMint",
            "type": "publicKey"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "totalSupply",
            "type": "u32"
          },
          {
            "name": "totalSales",
            "type": "u32"
          },
          {
            "name": "winnerIdx",
            "type": "u32"
          },
          {
            "name": "startDate",
            "type": "u64"
          },
          {
            "name": "endDate",
            "type": "u64"
          },
          {
            "name": "isDeposited",
            "type": "bool"
          },
          {
            "name": "isClaimed",
            "type": "bool"
          },
          {
            "name": "isWithdrawn",
            "type": "bool"
          },
          {
            "name": "reserved0",
            "type": "u128"
          },
          {
            "name": "reserved1",
            "type": "u128"
          },
          {
            "name": "reserved2",
            "type": "u128"
          },
          {
            "name": "reserved3",
            "type": "u128"
          },
          {
            "name": "tickets",
            "type": {
              "vec": {
                "defined": "RaffleTicket"
              }
            }
          }
        ]
      }
    },
    {
      "name": "userAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "raffleIdx",
            "type": "u32"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "uid",
            "type": {
              "array": [
                "u8",
                12
              ]
            }
          },
          {
            "name": "amount",
            "type": "u32"
          },
          {
            "name": "reserved0",
            "type": "u128"
          },
          {
            "name": "reserved1",
            "type": "u128"
          },
          {
            "name": "reserved2",
            "type": "u128"
          },
          {
            "name": "reserved3",
            "type": "u128"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "RaffleTicket",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "uid",
            "type": {
              "array": [
                "u8",
                12
              ]
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidSigner",
      "msg": "Invalid Signer"
    },
    {
      "code": 6001,
      "name": "InvalidWallet",
      "msg": "Invalid Wallet"
    },
    {
      "code": 6002,
      "name": "InvalidRaffleIdx",
      "msg": "Invalid raffle index"
    },
    {
      "code": 6003,
      "name": "InvalidUUID",
      "msg": "Invalid UUID"
    },
    {
      "code": 6004,
      "name": "InvalidDate",
      "msg": "Invalid date"
    },
    {
      "code": 6005,
      "name": "InsufficientBalance",
      "msg": "Token balance not enough"
    },
    {
      "code": 6006,
      "name": "RaffleNotStarted",
      "msg": "Raffle not started"
    },
    {
      "code": 6007,
      "name": "RaffleExpired",
      "msg": "Raffle has been expired"
    },
    {
      "code": 6008,
      "name": "RaffleNotEnded",
      "msg": "Raffle not ended"
    },
    {
      "code": 6009,
      "name": "RaffleAlreadyWithdrawn",
      "msg": "Raffle already withdrawn"
    },
    {
      "code": 6010,
      "name": "PrizeNotDeposited",
      "msg": "Prize not deposited"
    },
    {
      "code": 6011,
      "name": "PrizeAlreadyDeposited",
      "msg": "Prize already deposited"
    },
    {
      "code": 6012,
      "name": "PrizeAlreadyClaimed",
      "msg": "Prize already claimed"
    },
    {
      "code": 6013,
      "name": "WinnerNotRevealed",
      "msg": "Winner not revealed"
    },
    {
      "code": 6014,
      "name": "WinnerNotMatched",
      "msg": "Winner not matched"
    },
    {
      "code": 6015,
      "name": "SupplyLimitExceed",
      "msg": "Totaly supply limit exceed"
    },
    {
      "code": 6016,
      "name": "WalletLimitExceed",
      "msg": "Wallet supply limit exceed"
    },
    {
      "code": 6017,
      "name": "TotalSupplyLessTotalSales",
      "msg": "Total supply should be greater than total sales"
    },
    {
      "code": 6018,
      "name": "InvalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6019,
      "name": "NumericOverflow",
      "msg": "Numeric Overflow Error"
    },
    {
      "code": 6020,
      "name": "InvalidMint",
      "msg": "Invalid Mint"
    },
    {
      "code": 6021,
      "name": "InvalidTokenAccount",
      "msg": "Invalid Token Account"
    },
    {
      "code": 6022,
      "name": "InvalidPubkey",
      "msg": "Invalid Pubkey"
    },
    {
      "code": 6023,
      "name": "InvalidOwner",
      "msg": "Invalid Owner"
    },
    {
      "code": 6024,
      "name": "UninitializedAccount",
      "msg": "Uninitialized Account"
    },
    {
      "code": 6025,
      "name": "InvalidCollection",
      "msg": "Invalid Collection"
    },
    {
      "code": 6026,
      "name": "InvalidTokenStandard",
      "msg": "Invalid TokenStandard"
    },
    {
      "code": 6027,
      "name": "BadMetadata",
      "msg": "Bad Metadata"
    },
    {
      "code": 6028,
      "name": "WhitelistFull",
      "msg": "Whitelist is full"
    }
  ]
};

export const IDL: SolanaRaffle = {
  "version": "0.1.0",
  "name": "solana_raffle",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "vault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "globalAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "updateSetting",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "newAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "globalAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "addWhitelist",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "collection",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "removeWhitelist",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "collection",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "createRaffle",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "splMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "raffleAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idx",
          "type": "u32"
        },
        {
          "name": "totalSupply",
          "type": "u32"
        },
        {
          "name": "price",
          "type": "u64"
        },
        {
          "name": "startDate",
          "type": "u64"
        },
        {
          "name": "endDate",
          "type": "u64"
        }
      ]
    },
    {
      "name": "addPrize",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "raffleAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idx",
          "type": "u32"
        }
      ]
    },
    {
      "name": "addPrizePnft",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "raffleAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "delegateRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authorizationRules",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sysvarInstructions",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authorizationRulesProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idx",
          "type": "u32"
        }
      ]
    },
    {
      "name": "buyTicket",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "raffleAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "splMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idx",
          "type": "u32"
        },
        {
          "name": "uid",
          "type": {
            "array": [
              "u8",
              12
            ]
          }
        },
        {
          "name": "amount",
          "type": "u32"
        }
      ]
    },
    {
      "name": "withdrawRaffle",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "raffleAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "splMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idx",
          "type": "u32"
        }
      ]
    },
    {
      "name": "revealWinner",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "raffleAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "recentSlothashes",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idx",
          "type": "u32"
        }
      ]
    },
    {
      "name": "claimPrize",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "raffleAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "creatorTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "winnerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idx",
          "type": "u32"
        },
        {
          "name": "uid",
          "type": {
            "array": [
              "u8",
              12
            ]
          }
        }
      ]
    },
    {
      "name": "claimPrizePnft",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "raffleAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ownerTokenRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ownerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destTokenRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authorizationRules",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sysvarInstructions",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authorizationRulesProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "idx",
          "type": "u32"
        },
        {
          "name": "uid",
          "type": {
            "array": [
              "u8",
              12
            ]
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "globalAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "vault",
            "type": "publicKey"
          },
          {
            "name": "totalRaffles",
            "type": "u32"
          },
          {
            "name": "wlCollections",
            "type": {
              "array": [
                "publicKey",
                10
              ]
            }
          },
          {
            "name": "reserved0",
            "type": "u128"
          },
          {
            "name": "reserved1",
            "type": "u128"
          },
          {
            "name": "reserved2",
            "type": "u128"
          },
          {
            "name": "reserved3",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "raffleAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "idx",
            "type": "u32"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "splMint",
            "type": "publicKey"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "totalSupply",
            "type": "u32"
          },
          {
            "name": "totalSales",
            "type": "u32"
          },
          {
            "name": "winnerIdx",
            "type": "u32"
          },
          {
            "name": "startDate",
            "type": "u64"
          },
          {
            "name": "endDate",
            "type": "u64"
          },
          {
            "name": "isDeposited",
            "type": "bool"
          },
          {
            "name": "isClaimed",
            "type": "bool"
          },
          {
            "name": "isWithdrawn",
            "type": "bool"
          },
          {
            "name": "reserved0",
            "type": "u128"
          },
          {
            "name": "reserved1",
            "type": "u128"
          },
          {
            "name": "reserved2",
            "type": "u128"
          },
          {
            "name": "reserved3",
            "type": "u128"
          },
          {
            "name": "tickets",
            "type": {
              "vec": {
                "defined": "RaffleTicket"
              }
            }
          }
        ]
      }
    },
    {
      "name": "userAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "raffleIdx",
            "type": "u32"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "uid",
            "type": {
              "array": [
                "u8",
                12
              ]
            }
          },
          {
            "name": "amount",
            "type": "u32"
          },
          {
            "name": "reserved0",
            "type": "u128"
          },
          {
            "name": "reserved1",
            "type": "u128"
          },
          {
            "name": "reserved2",
            "type": "u128"
          },
          {
            "name": "reserved3",
            "type": "u128"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "RaffleTicket",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "uid",
            "type": {
              "array": [
                "u8",
                12
              ]
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidSigner",
      "msg": "Invalid Signer"
    },
    {
      "code": 6001,
      "name": "InvalidWallet",
      "msg": "Invalid Wallet"
    },
    {
      "code": 6002,
      "name": "InvalidRaffleIdx",
      "msg": "Invalid raffle index"
    },
    {
      "code": 6003,
      "name": "InvalidUUID",
      "msg": "Invalid UUID"
    },
    {
      "code": 6004,
      "name": "InvalidDate",
      "msg": "Invalid date"
    },
    {
      "code": 6005,
      "name": "InsufficientBalance",
      "msg": "Token balance not enough"
    },
    {
      "code": 6006,
      "name": "RaffleNotStarted",
      "msg": "Raffle not started"
    },
    {
      "code": 6007,
      "name": "RaffleExpired",
      "msg": "Raffle has been expired"
    },
    {
      "code": 6008,
      "name": "RaffleNotEnded",
      "msg": "Raffle not ended"
    },
    {
      "code": 6009,
      "name": "RaffleAlreadyWithdrawn",
      "msg": "Raffle already withdrawn"
    },
    {
      "code": 6010,
      "name": "PrizeNotDeposited",
      "msg": "Prize not deposited"
    },
    {
      "code": 6011,
      "name": "PrizeAlreadyDeposited",
      "msg": "Prize already deposited"
    },
    {
      "code": 6012,
      "name": "PrizeAlreadyClaimed",
      "msg": "Prize already claimed"
    },
    {
      "code": 6013,
      "name": "WinnerNotRevealed",
      "msg": "Winner not revealed"
    },
    {
      "code": 6014,
      "name": "WinnerNotMatched",
      "msg": "Winner not matched"
    },
    {
      "code": 6015,
      "name": "SupplyLimitExceed",
      "msg": "Totaly supply limit exceed"
    },
    {
      "code": 6016,
      "name": "WalletLimitExceed",
      "msg": "Wallet supply limit exceed"
    },
    {
      "code": 6017,
      "name": "TotalSupplyLessTotalSales",
      "msg": "Total supply should be greater than total sales"
    },
    {
      "code": 6018,
      "name": "InvalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6019,
      "name": "NumericOverflow",
      "msg": "Numeric Overflow Error"
    },
    {
      "code": 6020,
      "name": "InvalidMint",
      "msg": "Invalid Mint"
    },
    {
      "code": 6021,
      "name": "InvalidTokenAccount",
      "msg": "Invalid Token Account"
    },
    {
      "code": 6022,
      "name": "InvalidPubkey",
      "msg": "Invalid Pubkey"
    },
    {
      "code": 6023,
      "name": "InvalidOwner",
      "msg": "Invalid Owner"
    },
    {
      "code": 6024,
      "name": "UninitializedAccount",
      "msg": "Uninitialized Account"
    },
    {
      "code": 6025,
      "name": "InvalidCollection",
      "msg": "Invalid Collection"
    },
    {
      "code": 6026,
      "name": "InvalidTokenStandard",
      "msg": "Invalid TokenStandard"
    },
    {
      "code": 6027,
      "name": "BadMetadata",
      "msg": "Bad Metadata"
    },
    {
      "code": 6028,
      "name": "WhitelistFull",
      "msg": "Whitelist is full"
    }
  ]
};
