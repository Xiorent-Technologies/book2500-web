// Update match odds values
        potentialInvestMatchOdds?.value =
            betLogModel.potentialInvestMatchOdds ?? '';
        potentialReturnMatchOdds?.value =
            betLogModel.potentialReturnMatchOdds ?? '';
        selectionIdMatchOdds?.value = betLogModel.selectionIdMatchOdds ?? '';
        isBackMatchOdds?.value = betLogModel.isBackMatchOdds ?? 0;

        if (isBackMatchOdds?.value == 1) {
          potentialInvestMatchOdds?.value =
              '-₹${potentialInvestMatchOdds?.value}';
          potentialReturnMatchOdds?.value =
              '+₹${potentialReturnMatchOdds?.value}';
        } else {
          potentialInvestMatchOdds?.value =
              '+₹${potentialInvestMatchOdds?.value}';
          potentialReturnMatchOdds?.value =
              '-₹${potentialReturnMatchOdds?.value}';
        }

        // Print bookmaker data
        print('Bookmaker Data:');
        print('Potential Invest: ${betLogModel.potentialInvestBookmaker}');
        print('Potential Return: ${betLogModel.potentialReturnBookmaker}');
        print('Selection ID: ${betLogModel.selectionIdBookmaker}');
        print('Is Back: ${betLogModel.isBackBookmaker}');

        // Update bookmaker values
        potentialInvestBookmaker?.value =
            betLogModel.potentialInvestBookmaker ?? '';
        potentialReturnBookmaker?.value =
            betLogModel.potentialReturnBookmaker ?? '';
        selectionIdBookmaker?.value = betLogModel.selectionIdBookmaker ?? '';
        isBackBookmaker?.value = betLogModel.isBackBookmaker ?? 0;