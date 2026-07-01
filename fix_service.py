import re

with open("BE/src/v1/poker-lobby/poker-game.service.ts", "r") as f:
    content = f.read()

# 1. Remove the malformed finalizeAndBroadcastHand method
content = re.sub(r'  private async finalizeAndBroadcastHand\(.*?\n  }\n\n', '', content, flags=re.DOTALL)

# 2. Re-insert a correct version of processShowdown ending
# Currently it has:
#    await this.finalizeAndBroadcastHand(roomId, winnersLog, totalPotAmount, tableState, seats);
#    }
#
#    console.log(`[SHOWDOWN] rake`, {
#    ...
#    console.log(`[SHOWDOWN] timer set id=${timerId} room=${roomId}`);
#  }
# Let's replace the whole block from "const totalPotAmount = parseInt(" to the end of processShowdown.
ps_pattern = r'    const totalPotAmount = parseInt\(\n      tableState.total_pot \|\| \'0\',\n    \);\n.*?console\.log\(`\[SHOWDOWN\] timer set id=\$\{timerId\} room=\$\{roomId\}`\);\n  }'
ps_correct = """    const totalPotAmount = parseInt(
      tableState.total_pot || '0',
    );
    await this.finalizeAndBroadcastHand(roomId, winnersLog, totalPotAmount, tableState, seats);
  }"""
content = re.sub(ps_pattern, ps_correct, content, flags=re.DOTALL)

# 3. Re-insert a correct version of endHandEarly
ehe_pattern = r'    // 2\. Khấu trừ Rake.*?\n  async executeAutoAction'
# Wait, currently endHandEarly has:
#    await this.finalizeAndBroadcastHand(roomId, winnersLog, winAmount, tableState, seats);
#    // 2. Khấu trừ Rake (mặc định 5%)
#    const totalPotAmount = winAmount;
#    ...
#    }, 15000);
#  }
#  async executeAutoAction
# Wait, let's see what is exactly in endHandEarly now.
