# WMS 前端原型 PRD 模块索引（V1.0）

> 仅前端原型；不含库表/API/后端逻辑。

## 03 拆柜

| 页面 | 路由名 | 说明 |
|------|--------|------|
| 拆柜订单列表 | `wms_devanning-order` | 已有；柜号/提单/客户/状态等 |
| 拆柜订单详情 | `wms_devanning-order-detail` | Tab：基础/货件/托盘/附件/日志 |
| PC 触摸屏拆柜作业 | `wms_devanning-work` | 左柜信息/中收货/右托盘 |

## 04 入库

| 页面 | 路由名 |
|------|--------|
| 入库单列表 | `wms_inbound-order` |
| 入库任务页 | `wms_inbound-task` |

## 05 上架

| 页面 | 路由名 |
|------|--------|
| 上架任务列表 | `wms_putaway-task` |
| PDA 上架 | `wms_putaway-pda` |

## 07 操作指令

| 页面 | 路由名 |
|------|--------|
| 操作指令单列表 | `wms_operation-order` |

操作类型：换标、贴标、拍照、质检、组套、换包装、拆包装。

## 08 增值服务

| 页面 | 路由名 |
|------|--------|
| 增值服务任务列表 | `wms_vas-task` |
| 增值作业页 | `wms_vas-work` |

## 09 备货

| 页面 | 路由名 |
|------|--------|
| 备货单列表 | `wms_stock-prep-order` |
| 备货任务列表 | `wms_stock-prep-task` |
| 备货执行页 | `wms_stock-prep-exec` |

## 10 出库

| 页面 | 路由名 |
|------|--------|
| 出库执行页 | `wms_outbound-exec` |
| 装车确认页 | `wms_outbound-loading` |

（出库单列表可复用 OMS `oms_outbound-order` 或库存组 `wms_pallet-outbound` 历史）

## PDA

| 页面 | 路由名 |
|------|--------|
| PDA 首页 | `pda_home` |
| 统一任务页 | `pda_task` |

任务类型：上架、拣货、增值、备货、出库、盘点。
