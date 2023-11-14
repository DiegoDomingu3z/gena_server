class AuthTokens {
  /**
   * authToken
   * GEnerate random token for user
   *
   * @returns {String}
   */
  async authToken() {
    const char = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const num = "0123456789";
    let generatedChar = "";
    let generatedNum = "";
    const charLen = char.length;
    const numLen = num.length;
    let count = 0;
    while (count < 30) {
      generatedChar += char.charAt(Math.floor(Math.random() * charLen));
      generatedNum += num.charAt(Math.floor(Math.random() * numLen));
      count += 1;
    }
    let tok = generatedChar + generatedNum;
    let arr = tok.split("");
    let len = arr.length;

    for (let i = 0; i < len - 1; i++) {
      let j = Math.floor(Math.random() * (len - i)) + i;
      let temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr.join("");
  }
}

export const authTokens = new AuthTokens();
