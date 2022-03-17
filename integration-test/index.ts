import {
  Coin,
  isTxError,
  LCDClient,
  MnemonicKey,
  Msg,
  MsgInstantiateContract,
  MsgExecuteContract,
  MsgStoreCode,
  Fee,
  Wallet,
  WasmAPI,
} from "@terra-money/terra.js";
import info from "./constant";
import * as path from "path";
import * as fs from "fs";

(async () => {
  // Create LCDClient for Bombay-12 TestNet
  const terra: LCDClient = new LCDClient({
    URL: info.NETWORK,
    chainID: info.CHAIN_ID,
  });

  // Get deployer wallet
  const wallet = terra.wallet(new MnemonicKey({ mnemonic: info.WALLET_SEEDS }));
  console.log("Wallet: ", wallet.key.accAddress);

  // Deploy wasm to testnet
  const storeCode = new MsgStoreCode(
		wallet.key.accAddress,
		fs.readFileSync('../artifacts/terra101.wasm').toString('base64')
	);
	const storeCodeTx = await wallet.createAndSignTx({
		msgs: [storeCode],
	});
	const storeCodeTxResult = await terra.tx.broadcast(storeCodeTx);
	
	console.log(storeCodeTxResult);
	
	if (isTxError(storeCodeTxResult)) {
		throw new Error(
			`store code failed. code: ${storeCodeTxResult.code}, codespace: ${storeCodeTxResult.codespace}`
		);
	}
	
	const {
		store_code: { code_id },
	} = storeCodeTxResult.logs[0].eventsByType;
  console.log("Done");
  console.log("\nCodeId: ", code_id[0]);

  // Instantiate contract
  console.log("\n\nInstantiate token contract");
	const instantiate = new MsgInstantiateContract(
		wallet.key.accAddress,wallet.key.accAddress,
		Number(code_id[0]), // code ID
		{
			count: 0,
		}, // InitMsg
	);
	
	const instantiateTx = await wallet.createAndSignTx({
		msgs: [instantiate],
	});
	const instantiateTxResult = await terra.tx.broadcast(instantiateTx);

	if (isTxError(instantiateTxResult)) {
		throw new Error(
			`instantiate failed. code: ${instantiateTxResult.code}, codespace: ${instantiateTxResult.codespace}}`
		);
	}
	
	const {
		instantiate_contract: { contract_address },
	} = instantiateTxResult.logs[0].eventsByType;

	console.log("contract_address?", contract_address[0])

	const increase = new MsgExecuteContract(
		wallet.key.accAddress, // sender
		contract_address[0].toString(), // contract account address
		{ "increment": {} }, // handle msg
	);
	
	const increaseTx = await wallet.createAndSignTx({
		msgs: [increase]
	});
	
	const increaseTxTxResult = await terra.tx.broadcast(increaseTx);
	console.log("increaseTxTxResult?", increaseTxTxResult)
  
})();