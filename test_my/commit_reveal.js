const CommitReveal = artifacts.require("CommitReveal");
const { time } = require("@openzeppelin/test-helpers");

contract("CommitReveal", async (accounts) => {
  let commitRevealWrapper = undefined;

  const commitInfos = [
    { account: accounts[0], vote: "1", secret: "secret00" },
    { account: accounts[1], vote: "2", secret: "secret10" },
    { account: accounts[2], vote: "1", secret: "secret20" },
    { account: accounts[3], vote: "2", secret: "secret30" },
    { account: accounts[4], vote: "2", secret: "secret40" },
    { account: accounts[0], vote: "2", secret: "secret01" },
    { account: accounts[1], vote: "1", secret: "secret11" },
    { account: accounts[2], vote: "2", secret: "secret21" },
    { account: accounts[3], vote: "2", secret: "secret31" },
    { account: accounts[4], vote: "1", secret: "secret41" },
  ];

  const expectedNumberOfVotesCast = commitInfos.length;
  const expectedVotesForChoice1 = commitInfos.filter(
    (commitInfo) => commitInfo.vote === "1"
  ).length;
  const expectedVotesForChoice2 = commitInfos.filter(
    (commitInfo) => commitInfo.vote === "2"
  ).length;
  const expectedWinner =
    expectedVotesForChoice1 > expectedVotesForChoice2
      ? "YES"
      : expectedVotesForChoice1 < expectedVotesForChoice2
      ? "NO"
      : "It was a tie!";

  it("deploy contract", async () => {
    commitRevealWrapper = await CommitReveal.deployed();

    assert.notEqual(
      commitRevealWrapper.address,
      undefined,
      "CommitReveal is not deployed"
    );
  });

  it("users vote during phase period", async () => {
    await Promise.all(
      commitInfos.map((commitInfo) =>
        commitRevealWrapper.commitVote.sendTransaction(
          web3.utils.soliditySha3(`${commitInfo.vote}~${commitInfo.secret}`),
          {
            from: commitInfo.account,
          }
        )
      )
    );
    const numberOfVotesCast = (
      await commitRevealWrapper.numberOfVotesCast()
    ).toNumber();
    assert.equal(
      numberOfVotesCast,
      expectedNumberOfVotesCast,
      "incorrect numberOfVotesCast"
    );
  });

  it("users reveal their votes", async () => {
    await Promise.all(
      commitInfos.map((commitInfo) =>
        commitRevealWrapper.revealVote.sendTransaction(
          `${commitInfo.vote}~${commitInfo.secret}`,
          web3.utils.soliditySha3(`${commitInfo.vote}~${commitInfo.secret}`),
          {
            from: commitInfo.account,
          }
        )
      )
    );

    const votesForChoice1 = await commitRevealWrapper.votesForChoice1();
    const votesForChoice2 = await commitRevealWrapper.votesForChoice2();
    assert.equal(
      votesForChoice1,
      expectedVotesForChoice1,
      "incorrect votesForChoice1"
    );
    assert.equal(
      votesForChoice2,
      expectedVotesForChoice2,
      "incorrect votesForChoice2"
    );
  });

  it("wait to phase over", async () => {
    await time.increase(2 * 60);
  });

  it("get final vote result", async () => {
    const winner = await commitRevealWrapper.getWinner();

    assert.equal(winner, expectedWinner, "incorrect winner");
  });
});

