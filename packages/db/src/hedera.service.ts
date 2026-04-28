import {
  AccountId,
  Client,
  PrivateKey,
  AccountBalanceQuery,
  TransferTransaction,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicMessageQuery,
  TokenMintTransaction,
  TransactionId,
  Hbar,
  type AccountBalance,
  type TransactionRecord,
  type TopicMessage,
} from "@hashgraph/sdk";

interface HederaConfig {
  network: "mainnet" | "testnet" | "previewnet";
  operatorId: string;
  operatorPrivateKey: string;
}

export interface HCSMessage {
  sequenceNumber: number;
  contents: string;
  consensusTimestamp: Date;
}

/**
 * Hedera network service — wraps the Hedera SDK for common DePIN operations.
 */
export class HederaService {
  private readonly client: Client;
  private readonly operatorId: AccountId;
  private readonly operatorKey: PrivateKey;

  constructor(config: HederaConfig) {
    this.operatorId = AccountId.fromString(config.operatorId);
    this.operatorKey = PrivateKey.fromString(config.operatorPrivateKey);

    switch (config.network) {
      case "mainnet":
        this.client = Client.forMainnet();
        break;
      case "previewnet":
        this.client = Client.forPreviewnet();
        break;
      default:
        this.client = Client.forTestnet();
    }

    this.client.setOperator(this.operatorId, this.operatorKey);
  }

  /** Returns the HBAR balance of a given account. */
  async getAccountBalance(accountId: string): Promise<AccountBalance> {
    return new AccountBalanceQuery()
      .setAccountId(AccountId.fromString(accountId))
      .execute(this.client);
  }

  /** Transfers HBAR from the operator to a recipient. */
  async transferHBAR(recipientId: string, amountHbar: number): Promise<string> {
    const tx = await new TransferTransaction()
      .addHbarTransfer(this.operatorId, Hbar.fromTinybars(-amountHbar * 1e8))
      .addHbarTransfer(AccountId.fromString(recipientId), Hbar.fromTinybars(amountHbar * 1e8))
      .execute(this.client);

    await tx.getReceipt(this.client);
    return tx.transactionId.toString();
  }

  /** Creates a new HCS topic and returns the topic ID string. */
  async createTopic(memo?: string): Promise<string> {
    const tx = await new TopicCreateTransaction()
      .setTopicMemo(memo ?? "HederaNet topic")
      .execute(this.client);

    const receipt = await tx.getReceipt(this.client);
    if (!receipt.topicId) throw new Error("Topic creation failed");
    return receipt.topicId.toString();
  }

  /** Submits a message to an HCS topic and returns the transaction ID. */
  async submitToHCS(topicId: string, message: string): Promise<string> {
    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(message)
      .execute(this.client);

    await tx.getReceipt(this.client);
    return tx.transactionId.toString();
  }

  /**
   * Subscribes to HCS topic messages starting from a given time.
   * Calls onMessage for each message received.
   */
  getHCSMessages(
    topicId: string,
    startTime: Date,
    onMessage: (msg: HCSMessage) => void,
  ): void {
    new TopicMessageQuery()
      .setTopicId(topicId)
      .setStartTime(startTime)
      .subscribe(this.client, null, (message: TopicMessage) => {
        onMessage({
          sequenceNumber: Number(message.sequenceNumber),
          contents: Buffer.from(message.contents).toString("utf-8"),
          consensusTimestamp: message.consensusTimestamp.toDate(),
        });
      });
  }

  /** Retrieves the full transaction record for a given transaction ID. */
  async getTransactionRecord(txId: string): Promise<TransactionRecord> {
    const transactionId = TransactionId.fromString(txId);
    const query = await import("@hashgraph/sdk").then(
      (sdk) => new sdk.TransactionRecordQuery().setTransactionId(transactionId),
    );
    return query.execute(this.client);
  }

  /** Mints additional supply of an existing HTS fungible/NFT token. */
  async mintNFT(tokenId: string, metadata: Uint8Array[]): Promise<string> {
    const tx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata(metadata)
      .execute(this.client);

    await tx.getReceipt(this.client);
    return tx.transactionId.toString();
  }

  /** Closes the SDK client connection. */
  close(): void {
    this.client.close();
  }
}

let _hederaService: HederaService | null = null;

/** Returns a singleton HederaService instance. */
export function getHederaService(): HederaService {
  if (!_hederaService) {
    _hederaService = new HederaService({
      network: (process.env["HEDERA_NETWORK"] ?? "testnet") as
        | "mainnet"
        | "testnet"
        | "previewnet",
      operatorId: process.env["HEDERA_OPERATOR_ID"] ?? "",
      operatorPrivateKey: process.env["HEDERA_OPERATOR_PRIVATE_KEY"] ?? "",
    });
  }
  return _hederaService;
}
