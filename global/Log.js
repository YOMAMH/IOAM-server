/**
 * Created by renminghe on 2017/4/18.
 */
module.exports = {
    
    /**
     * 工单日志
     * @param active  操作
     * @param user  操作用户
     */
    workOrderLog: (active, user, acceptUser) => {
        let time = new Date().toLocaleString();
        if (active === "创建") {
            return `${time}   ${active}并提交给${acceptUser}, 操作用户：${user};\n`;
        } else if (active === "转出") {
            return `${time}  ${active}给${acceptUser}, 操作用户: ${user};\n`;
        }
        return `${time}  ${active}, 操作用户：${user};\n`;
    },
};