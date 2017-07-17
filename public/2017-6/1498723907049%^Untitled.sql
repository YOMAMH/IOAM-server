ALTER TABLE `ty_cmdb`.`user_base` 
ADD COLUMN `group` VARCHAR(45) NULL DEFAULT 'tingyun_netop' AFTER `name`;

ALTER TABLE `ty_cmdb`.`user_base` 
CHANGE COLUMN `auth` `auth` VARCHAR(45) NULL DEFAULT '1.1' COMMENT '用户权限：默认为1；\n1.1：研发， 权限：提交工单，查看个人提交工单；\n1.2：测试， 权限：提交个人工单，处理应用工单，查看个人工单；\n1.3：产品， 权限：提交个人工单，处理应用工单，查看个人工单；\n2：运维，权限：提交个人工单，处理应用和主机工单，查看个人和公有工单;\n3: 系统管理员: 权限: 提交个人工单, 处理所有工单， 查看所有工单；' ;

ALTER TABLE `ty_cmdb`.`work_order_production` 
CHANGE COLUMN `reason` `reason` TEXT CHARACTER SET 'utf8' COLLATE 'utf8_bin' NULL DEFAULT NULL COMMENT '运维意见' ,
ADD COLUMN `tester_action` TEXT NULL COMMENT '测试意见' AFTER `order_type`,
ADD COLUMN `proer_action` TEXT NULL COMMENT '产品意见' AFTER `tester_action`;


