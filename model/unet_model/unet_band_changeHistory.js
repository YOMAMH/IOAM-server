/**
 * Created by renminghe on 2017/4/10.
 */
const Sequelize = require("../../global/sequelize");
const sequelize = require("sequelize");

function selectTable() {
    let Info = Sequelize.define("unet_band_change_history_info",{
        id : {    // 主键自增id
            type: sequelize.INTEGER,
            primaryKey: true
        },
        ShareBandwidthId : sequelize.STRING,
        ChangeInfo : sequelize.TEXT,    // 变更内容
        ChangeTime : sequelize.STRING,    // 变更时间
        Action : sequelize.STRING,    // 变更方式  create update  delete
        Tag : sequelize.STRING    // 所属业务组
    },{
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
    });
    return Info;
}
module.exports = {
    createChangeInfo:(arg, changeInfo, action) => {
        if (arg) {
            let Info = selectTable();
            return Info.create({
                ShareBandwidthId:arg.ShareBandwidthId,
                ChangeInfo:changeInfo,
                Action:action,
                Tag:arg.Tag
            }).then((data) => {
                if (!data) return '';
                return data;
            }).catch((err) => console.log(err));
        }
    },
};
