import Wallet from '../models/Wallet.js';

const TEMP_TEST_BALANCE = 10000;

export const getWalletBalance = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id, balance: TEMP_TEST_BALANCE });
    }
    res.json({ balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id, balance: TEMP_TEST_BALANCE });
      return res.json({ balance: wallet.balance });
    }

    wallet.balance = TEMP_TEST_BALANCE;
    const updatedWallet = await wallet.save();
    res.json({ balance: updatedWallet.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
