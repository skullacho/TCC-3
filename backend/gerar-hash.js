import {randomBytes,scryptSync} from "node:crypto";
import {createInterface} from "node:readline";
const rl = createInterface({input:process.stdin,output:process.stdout});
rl.question("Digite a senha do administrador: ", senha => {
  const salt=randomBytes(16); const hash=scryptSync(senha,salt,64);
  console.log("ADMIN_PASSWORD_HASH="+salt.toString("hex")+":"+hash.toString("hex"));
  rl.close();
});
