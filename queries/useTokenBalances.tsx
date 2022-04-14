import { useQuery } from 'react-query';
import { ITokenLists } from 'types';
import { useAccount } from 'wagmi';
import BigNumber from 'bignumber.js';
import { useNetworkProvider } from 'hooks';
import { Provider } from 'utils/contract';
import useTokenList from 'hooks/useTokenList';
import { Contract } from 'ethers';

interface IFetchBalance {
  userAddress: string;
  tokens: ITokenLists[] | null;
  provider: Provider | null;
}

interface ITokenBalance {
  name: string;
  tokenAddress: string;
  decimals: number;
  tokenContract: Contract;
  llamaContractAddress: string;
  symbol: string;
  logoURI: string;
  balance: string | null;
}

const fetchBalance = async ({ userAddress, tokens, provider }: IFetchBalance) => {
  if (!userAddress || userAddress === '' || !tokens || !provider) return null;

  try {
    const res = await Promise.all(tokens.map((token) => token.tokenContract.balanceOf(userAddress)));

    const balances =
      res
        ?.map((balance, index) => {
          const bal = new BigNumber(balance.toString()).dividedBy(10 ** tokens[index].decimals);
          return {
            name: tokens[index].isVerified ? tokens[index].name : tokens[index].tokenAddress,
            tokenAddress: tokens[index].tokenAddress,
            decimals: tokens[index].decimals,
            tokenContract: tokens[index].tokenContract,
            llamaContractAddress: tokens[index].llamaContractAddress,
            symbol: tokens[index].symbol,
            logoURI: tokens[index].logoURI,
            balance: bal ? bal.toFixed(5) : null,
          };
        })
        ?.sort((a, b) => {
          if (!a.balance) return -1;
          if (!b.balance) return 1;

          if (a.balance < b.balance) {
            return 1;
          }
          if (a.balance > b.balance) {
            return -1;
          }
          return 0;
        }) ?? null;

    return balances;
  } catch (error) {
    // console.log(error);
    return null;
  }
};

function useTokenBalances() {
  const [{ data: accountData }] = useAccount();
  const { provider, network } = useNetworkProvider();
  const tokens = useTokenList();

  const userAddress = accountData?.address.toLowerCase() ?? '';

  return useQuery<ITokenBalance[] | null>(['allTokenBalances', network, userAddress], () =>
    fetchBalance({ userAddress, tokens, provider })
  );
}

export default useTokenBalances;