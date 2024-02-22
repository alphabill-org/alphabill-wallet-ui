import { CHAIN_NAMESPACES } from "@web3auth/base";
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";

let web3auth = null;
let secret = null;

async function init() {
    const clientId = "BIm6wkge8Pvzp1r8NDX644Ki-CIU2F3TYa2EUoXCx5QBvgVG5bGHI8VhgPa5JFe7SYAOy8Cx0pFdAClt15rGvtA";

    const chainConfig = {
	chainNamespace: CHAIN_NAMESPACES.OTHER,
	chainId: "0x1",
	rpcTarget: "https://money-backend.testnet.alphabill.org",
	displayName: "Alphabill Money partition testnet",
	ticker: "AB",
	tickerName: "Alphabill",
    };

    const privateKeyProvider = new CommonPrivateKeyProvider({
	config: { chainConfig },
    });
    const openloginAdapter = new OpenloginAdapter({
	privateKeyProvider: privateKeyProvider,
    });

    web3auth = new window.Modal.Web3Auth({
	clientId,
	chainConfig,
	web3AuthNetwork: "sapphire_devnet",
	authMode: "WALLET"
    });

    web3auth.configureAdapter(openloginAdapter);

    await web3auth.initModal();

    setTimeout(recoverSecret, 3000);
}

async function recoverSecret(){
    if(!web3auth) return null;
    try{
	await web3auth.connect();

	const provider = web3auth.provider;
	secret = await provider.request({method: 'private_key'});
	
//	await web3auth.logout();

	return secret;
    }catch(err){
	console.error(err);
	return null;
    }
}

function getSecret(){
    return secret;
}

const Web3AuthUse = {
    init,
    recoverSecret,
    getSecret
}

export default Web3AuthUse;
