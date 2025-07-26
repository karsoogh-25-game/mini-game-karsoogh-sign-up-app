module.exports = (sequelize, DataTypes) => {
  const RiskGame = sequelize.define('RiskGame', {
    riskLimit: { // Renamed from ceiling
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    multiplier: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    totalRisk: { // Renamed from totalLoaned
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  });

  RiskGame.associate = (models) => {
    RiskGame.hasMany(models.RiskEntry, { as: 'entries', foreignKey: 'gameId' });
  };

  return RiskGame;
};
