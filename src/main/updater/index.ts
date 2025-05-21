

if (!IS_UPDATER_DISABLED)
    require(IS_STANDALONE ? "./http" : "./git");
