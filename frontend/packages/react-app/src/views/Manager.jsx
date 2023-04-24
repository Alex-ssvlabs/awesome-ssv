import { useState } from 'react';
import { List, Typography, Input, Divider, Form, Button } from "antd";
import { useContractReader } from "eth-hooks";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { Address, Balance } from "../components";
import { ethers } from "ethers";
import generateDepositData from '../helpers/generateDepositData';
import generateKeyshares from '../helpers/generateKeyshares'

const { Search } = Input;

export default function Manager({ localProvider, tx, writeContracts, readContracts }) {
  const [depositData, setDepositData] = useState(null);
  const [depositDataRoot, setDepositDataRoot] = useState(null);
  const operators = useContractReader(readContracts, "StakingPool", "getOperators");
  const pubKeyEvents = useEventListener(readContracts, "StakingPool", "PubKeyDeposited", localProvider, 5);
  const validators = useContractReader(readContracts, "StakingPool", "getValidators");

  console.log("all validators", validators)

  const handleOnSetNewOperators = async value => {
    await tx(writeContracts.StakingPool.updateOperators(JSON.parse(value)));
  };

  const handleUpdateBeaconRewards = async value => {
    await tx(writeContracts.StakingPool.updateBeaconRewards(ethers.utils.parseEther(value.toString()).toString()));
  };

  const onDepositSharesSubmit = async values => {
    console.log("values:", values);
    await tx(
      writeContracts.StakingPool.depositShares(
        values.pubkey.toString(),
        JSON.parse(values.operatorIds),
        JSON.parse(values.sharesPublicKeys),
        JSON.parse(values.sharesEncrypted),
        ethers.utils.parseEther(values.amount.toString()).toString(),
      ),
    );
  };

  const onDepositSharesFailed = errorInfo => {
    console.log("Failed:", errorInfo);
  };

  const onDepositValidatorSubmit = async values => {
    await tx(
      writeContracts.StakingPool.depositValidator(
        values.pubkey,
        values.withdrawalCredentials,
        values.signature,
        values.depositDataRoot
      ),
    );
  };

  const onDepositValidatorFailed = errorInfo => {
    console.log("Failed:", errorInfo);
  };

  const onGenerateDepositData = async () => {
    const data = await generateDepositData();
    console.log("depositData", data.depositData);
    console.log("depositDataRoot", data.depositDataRoot);
    setDepositData(data.depositData);
    setDepositDataRoot(data.depositDataRoot);
  }

  const onGenerateKeyshares = async () => {
    await generateKeyshares();
  }

  return (
    <div>
      <div style={{ border: "1px solid #cccccc", width: 600, margin: "auto", marginTop: 32 }}>
        <h2 style={{ paddingTop: 16 }}>Pool managed overview:</h2>

        <div style={{ display: "flex" }}>
          <List
            style={{ width: "65%", margin: "auto", marginBlock: 32 }}
            header={<h4>All Pool managed validators</h4>}
            bordered
            dataSource={validators}
            renderItem={item => (
              <List.Item>
                <Typography.Text mark>[Validator]</Typography.Text> {item}
              </List.Item>
            )}
          />
          <List
            style={{ width: "25%", margin: "auto", marginBlock: 32 }}
            size="small"
            header={<h4>All Operators</h4>}
            bordered
            dataSource={operators}
            renderItem={item => <List.Item>{item}</List.Item>}
          />
        </div>
      </div>
      <div
        style={{
          border: "1px solid #cccccc",
          width: 600,
          justifyContent: "center",
          margin: "auto",
          marginTop: 32,
          padding: 16,
        }}
      >
        <h2>Manager actions:</h2>
        <div style={{ marginInline: "50px" }}>
          <h4 style={{ padding: 8 }}>Set new operators: {"(e.g: [1, 2, 3, 4])"}</h4>
          <Search
            style={{ width: "70%", margin: "auto" }}
            placeholder="new operators Ids array"
            enterButton="Submit"
            size="medium"
            onSearch={value => handleOnSetNewOperators(value)}
          />
          <Divider />
          <h4 style={{ padding: 8, marginTop: 12 }}>Update Beacon chain rewards:</h4>
          <Search
            style={{ width: "70%", margin: "auto" }}
            placeholder="new Beacon chain rewards value"
            enterButton="Submit"
            size="medium"
            onSearch={value => handleUpdateBeaconRewards(value)}
          />
          <Divider />
          <div>
            <h4 style={{ padding: 8, marginTop: 12 }}>Deposit validator:</h4>
            <div style={{ padding: 8, marginBottom: 12 }}>
              <a
                style={{ padding: 8 }}
                href="https://github.com/bloxapp/awesome-ssv/blob/backend/main.py"
                target="_blank"
                rel="noopener noreferrer"
              >
                🔑 Key distribution / splitting in Awesome SSV repo (Line: 22)
              </a>
              <a
                style={{ padding: 8 }}
                href="https://github.com/bloxapp/awesome-ssv/blob/backend/demo-contract/contracts/environment/SSVNetwork.sol"
                target="_blank"
                rel="noopener noreferrer"
              >
                💽 Register validator function (Line: 199)
              </a>
              <a
                style={{ padding: 8 }}
                href="https://github.com/bloxapp/awesome-ssv/blob/main/RUN_BACKEND.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                🖥️ Generating deposit data in backend
              </a>
            </div>


            {!depositData && (
              <Button style={{ marginBottom: 22 }} onClick={onGenerateDepositData}>
                Generate Deposit Data
              </Button>
            )}

            <Form
              name="basic"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
              style={{ maxWidth: 500, margin: "auto" }}
              fields={[
                {
                  name: ["pubkey"],
                  value: depositData ? `0x${depositData.pubkey}` : undefined
                },
                {
                  name: ["withdrawalCredentials"],
                  value: depositData ? depositData.withdrawalCredentials : undefined
                },
                {
                  name: ["signature"],
                  value: depositData ? `0x${depositData.signature}` : undefined
                },
                {
                  name: ["depositDataRoot"],
                  value: depositDataRoot ? `${depositDataRoot}` : undefined
                }
              ]}
              onFinish={onDepositValidatorSubmit}
              onFinishFailed={onDepositValidatorFailed}
              autoComplete="off"
            >
              <Form.Item style={{ width: "100%", marginInline: "auto" }} label="Public key" name="pubkey">
                <Input placeholder="Please input the public key of the validator!" />
              </Form.Item>

              <Form.Item
                style={{ width: "100%", marginInline: "auto" }}
                label="Withdrawal credentials"
                name="withdrawalCredentials"
              >
                <Input placeholder="Please input the Withdrawal credentials of the validator!" />
              </Form.Item>

              <Form.Item style={{ width: "100%", marginInline: "auto" }} label="Signature" name="signature">
                <Input placeholder="Please input the signature of the deposit data!" />
              </Form.Item>

              <Form.Item
                style={{ width: "100%", marginInline: "auto" }}
                label="Deposit data root"
                name="depositDataRoot"
              >
                <Input placeholder="Please input the deposit data root!" />
              </Form.Item>

              <Form.Item wrapperCol={{ span: 16 }} style={{ marginInline: "auto", width: "50px" }}>
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
              </Form.Item>
            </Form>
          </div>

          <Divider />
          <div>
            <h3 style={{ padding: 8, marginTop: 12 }}>Deposit shares:</h3>
            <div style={{ padding: 8, marginBottom: 12 }}>
              <a
                style={{ padding: 8 }}
                href="https://github.com/bloxapp/awesome-ssv/blob/main/RUN_BACKEND.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                🖥️ Generating Keyshares in backend
              </a>
              <a
                style={{ padding: 8 }}
                href="https://github.com/bloxapp/awesome-ssv/blob/backend/demo-contract/contracts/environment/DepositContract.sol"
                target="_blank"
                rel="noopener noreferrer"
              >
                📜 Deposit contract source
              </a>
            </div>

            <Button style={{ marginBottom: 22 }} onClick={onGenerateKeyshares}>
                Generate Deposit Data
              </Button>
            <Form
              name="basic"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
              style={{ maxWidth: 500, margin: "auto" }}
              value={{ remember: true }}
              onFinish={onDepositSharesSubmit}
              onFinishFailed={onDepositSharesFailed}
              autoComplete="off"
            >
              <Form.Item style={{ width: "100%", marginInline: "auto" }} label="Public key" name="pubkey">
                <Input placeholder="Please input the public key of the validator" />
              </Form.Item>

              <Form.Item style={{ width: "100%", marginInline: "auto" }} label="Operator Ids " name="operatorIds">
                <Input placeholder="Please input Operator Ids array!" />
              </Form.Item>

              <Form.Item style={{ width: "100%", marginInline: "auto" }} label="Shares keys" name="sharesPublicKeys">
                <Input placeholder="Please input the array of the public keys of the shares!" />
              </Form.Item>

              <Form.Item
                style={{ width: "100%", marginInline: "auto" }}
                label="Encrypted shares"
                name="sharesEncrypted"
              >
                <Input placeholder="Please input the array of the encrypted shares!" />
              </Form.Item>

              <Form.Item style={{ width: "100%", marginInline: "auto" }} label="Amount" name="amount">
                <Input placeholder="Please input the amount!" />
              </Form.Item>

              <Form.Item wrapperCol={{ span: 16 }} style={{ marginInline: "auto", width: "50px" }}>
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
      <div style={{ width: 500, margin: "auto", marginTop: 32 }}>
        <h2 style={{ paddingTop: 16 }}>Public Key Deposited Events:</h2>
        <List
          dataSource={pubKeyEvents}
          renderItem={item => {
            return (
              <List.Item key={item.blockNumber}>
                <Address value={item.args[0]} fontSize={16} /> =>
                <Balance balance={item.args[1]} />
              </List.Item>
            );
          }}
        />
      </div>
    </div >
  );
}
