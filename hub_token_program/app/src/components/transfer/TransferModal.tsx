import { FC, useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import {
  Send,
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useHubCredential } from '@/hooks';
import { checkHubCredential, CredentialStatus } from '@/utils/kycVerification';
import toast from 'react-hot-toast';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyMint: string;
  propertyName: string;
  propertySymbol: string;
  balance: string;
  decimals?: number;
  onTransferSuccess?: () => void;
}

type TransferStep = 'input' | 'verify' | 'confirm' | 'processing' | 'success' | 'error';

export const TransferModal: FC<TransferModalProps> = ({
  isOpen,
  onClose,
  propertyMint,
  propertyName,
  propertySymbol,
  balance,
  decimals = 9,
  onTransferSuccess,
}) => {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { isActive, error: credentialError } = useHubCredential();

  const [step, setStep] = useState<TransferStep>('input');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [recipientCredentialStatus, setRecipientCredentialStatus] = useState<{
    hasCredential: boolean;
    isChecking: boolean;
    error: string | null;
  }>({ hasCredential: false, isChecking: false, error: null });
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setRecipientAddress('');
      setAmount('');
      setRecipientCredentialStatus({ hasCredential: false, isChecking: false, error: null });
      setTxSignature(null);
      setError(null);
    }
  }, [isOpen]);

  // Check recipient's Hub Credential status
  const checkRecipientCredential = async () => {
    if (!recipientAddress) return;

    try {
      new PublicKey(recipientAddress);
    } catch {
      setRecipientCredentialStatus({
        hasCredential: false,
        isChecking: false,
        error: 'Invalid wallet address',
      });
      return;
    }

    setRecipientCredentialStatus({ hasCredential: false, isChecking: true, error: null });

    try {
      const recipientPubkey = new PublicKey(recipientAddress);
      const result = await checkHubCredential(connection, recipientPubkey);

      if (result.isValid && result.status === CredentialStatus.Active) {
        setRecipientCredentialStatus({ hasCredential: true, isChecking: false, error: null });
      } else {
        setRecipientCredentialStatus({
          hasCredential: false,
          isChecking: false,
          error: result.error || 'Recipient does not have a valid Hub Credential',
        });
      }
    } catch (err) {
      setRecipientCredentialStatus({
        hasCredential: false,
        isChecking: false,
        error: 'Failed to check recipient credential',
      });
    }
  };

  // Validate inputs and proceed to verification
  const handleContinue = async () => {
    // Validate recipient address
    try {
      new PublicKey(recipientAddress);
    } catch {
      toast.error('Invalid recipient address');
      return;
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    const balanceNum = parseFloat(balance);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amountNum > balanceNum) {
      toast.error('Insufficient balance');
      return;
    }

    // Check Hub Credential status for both parties
    await checkRecipientCredential();
    setStep('verify');
  };

  // Execute the transfer
  const handleTransfer = async () => {
    if (!publicKey || !signTransaction) {
      toast.error('Wallet not connected');
      return;
    }

    if (!isActive) {
      toast.error('Your Hub Credential is not active');
      return;
    }

    if (!recipientCredentialStatus.hasCredential) {
      toast.error('Recipient does not have a Hub Credential');
      return;
    }

    setStep('processing');
    setError(null);

    try {
      const mintPubkey = new PublicKey(propertyMint);
      const recipientPubkey = new PublicKey(recipientAddress);
      const amountLamports = BigInt(Math.floor(parseFloat(amount) * 10 ** decimals));

      // Get associated token accounts
      const senderAta = await getAssociatedTokenAddress(
        mintPubkey,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      const recipientAta = await getAssociatedTokenAddress(
        mintPubkey,
        recipientPubkey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const transaction = new Transaction();

      // Check if recipient ATA exists
      try {
        await getAccount(connection, recipientAta, 'confirmed', TOKEN_2022_PROGRAM_ID);
      } catch {
        // Create recipient ATA if it doesn't exist
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            recipientAta,
            recipientPubkey,
            mintPubkey,
            TOKEN_2022_PROGRAM_ID
          )
        );
      }

      // Add transfer instruction
      // Note: The Transfer Hook will automatically verify both Hub Credentials on-chain
      transaction.add(
        createTransferInstruction(
          senderAta,
          recipientAta,
          publicKey,
          amountLamports,
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign and send transaction
      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      setTxSignature(signature);
      setStep('success');
      toast.success('Transfer successful!');
      onTransferSuccess?.();
    } catch (err) {
      console.error('Transfer error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Transfer failed';

      // Check for common Transfer Hook errors
      if (errorMessage.includes('custom program error')) {
        if (errorMessage.includes('KycVerificationRequired')) {
          setError('KYC verification required - Hub Credential not found');
        } else if (errorMessage.includes('CredentialRevoked')) {
          setError('Hub Credential is revoked');
        } else if (errorMessage.includes('CredentialExpired')) {
          setError('Hub Credential has expired');
        } else if (errorMessage.includes('CredentialSuspended')) {
          setError('Hub Credential is suspended');
        } else {
          setError(`Transfer failed: ${errorMessage}`);
        }
      } else {
        setError(errorMessage);
      }
      setStep('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md animate-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-solana-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-solana-purple-500/20 flex items-center justify-center">
              <Send className="w-5 h-5 text-solana-purple-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Transfer Tokens</h2>
              <p className="text-sm text-solana-dark-400">{propertyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-solana-dark-800 transition-colors"
          >
            <X className="w-5 h-5 text-solana-dark-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step: Input */}
          {step === 'input' && (
            <div className="space-y-4">
              {/* Balance */}
              <div className="p-4 bg-solana-dark-800/50 rounded-xl">
                <p className="text-sm text-solana-dark-400 mb-1">Available Balance</p>
                <p className="text-xl font-bold text-white">
                  {parseFloat(balance).toLocaleString()} {propertySymbol}
                </p>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium text-solana-dark-300 mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="Enter wallet address"
                  className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-xl text-white placeholder-solana-dark-500 focus:outline-none focus:ring-2 focus:ring-solana-purple-500"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-solana-dark-300 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-solana-dark-800 border border-solana-dark-600 rounded-xl text-white placeholder-solana-dark-500 focus:outline-none focus:ring-2 focus:ring-solana-purple-500 pr-20"
                  />
                  <button
                    onClick={() => setAmount(balance)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-solana-purple-400 hover:text-solana-purple-300"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Hub Credential Status */}
              <div className="p-4 bg-solana-dark-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  {isActive ? (
                    <>
                      <ShieldCheck className="w-5 h-5 text-solana-green-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Your Hub Credential</p>
                        <p className="text-xs text-solana-green-400">Active - Ready to transfer</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-5 h-5 text-yellow-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Hub Credential Required</p>
                        <p className="text-xs text-yellow-400">{credentialError || 'Please verify your identity'}</p>
                      </div>
                      <Button size="sm" onClick={() => window.location.href = '/kyc'}>
                        Get Credential
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleContinue}
                disabled={!recipientAddress || !amount || !isActive}
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step: Verify */}
          {step === 'verify' && (
            <div className="space-y-4">
              {/* Sender Status */}
              <div className="p-4 bg-solana-dark-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-solana-green-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Your Hub Credential</p>
                    <p className="text-xs text-solana-green-400">Verified</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>

              {/* Recipient Status */}
              <div className="p-4 bg-solana-dark-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  {recipientCredentialStatus.isChecking ? (
                    <>
                      <Loader2 className="w-5 h-5 text-solana-dark-400 animate-spin" />
                      <div>
                        <p className="text-sm font-medium text-white">Checking Recipient</p>
                        <p className="text-xs text-solana-dark-400">Verifying Hub Credential...</p>
                      </div>
                    </>
                  ) : recipientCredentialStatus.hasCredential ? (
                    <>
                      <ShieldCheck className="w-5 h-5 text-solana-green-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Recipient Hub Credential</p>
                        <p className="text-xs text-solana-green-400">Verified</p>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-5 h-5 text-red-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Recipient Hub Credential</p>
                        <p className="text-xs text-red-400">
                          {recipientCredentialStatus.error || 'Not found'}
                        </p>
                      </div>
                      <Badge variant="danger">Required</Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Warning */}
              {!recipientCredentialStatus.hasCredential && !recipientCredentialStatus.isChecking && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-400">Transfer Blocked</p>
                      <p className="text-xs text-red-300 mt-1">
                        The recipient must have a valid Hub Credential to receive tokens.
                        This requirement is enforced on-chain by the Transfer Hook.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transfer Summary */}
              {recipientCredentialStatus.hasCredential && (
                <div className="p-4 bg-solana-dark-800/50 rounded-xl space-y-2">
                  <p className="text-sm text-solana-dark-400">Transfer Summary</p>
                  <div className="flex justify-between">
                    <span className="text-solana-dark-300">Amount</span>
                    <span className="text-white font-medium">
                      {parseFloat(amount).toLocaleString()} {propertySymbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-solana-dark-300">To</span>
                    <span className="text-white font-mono text-sm">
                      {recipientAddress.slice(0, 4)}...{recipientAddress.slice(-4)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setStep('input')}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleTransfer}
                  disabled={!recipientCredentialStatus.hasCredential || recipientCredentialStatus.isChecking}
                >
                  Confirm Transfer
                </Button>
              </div>
            </div>
          )}

          {/* Step: Processing */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-solana-purple-400 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Processing Transfer</h3>
              <p className="text-sm text-solana-dark-400">
                Please wait while your transfer is being processed...
              </p>
              <p className="text-xs text-solana-dark-500 mt-4">
                The Transfer Hook will verify both Hub Credentials on-chain
              </p>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-solana-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-solana-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Transfer Successful!</h3>
              <p className="text-sm text-solana-dark-400 mb-4">
                {parseFloat(amount).toLocaleString()} {propertySymbol} has been sent to the recipient.
              </p>
              {txSignature && (
                <a
                  href={`https://explorer.solana.com/tx/${txSignature}?cluster=custom&customUrl=http://localhost:8899`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-solana-purple-400 hover:text-solana-purple-300"
                >
                  View on Explorer
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <div className="mt-6">
                <Button className="w-full" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Transfer Failed</h3>
              <p className="text-sm text-red-400 mb-4">{error}</p>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={() => setStep('input')}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
