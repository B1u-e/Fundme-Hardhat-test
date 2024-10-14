// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {
    // 枚举定义四种角色类型
    enum Role {
        Administrator, // 0--管理员
        Supplier, // 1--供应商
        LogisticsEmployee, // 2--物流员工
        Controller // 3--管理员
    }

    //实体类型
    enum EntityType {
        None, // 0--无
        Constructor, // 1--制造商
        Supplier, // 2--供应商
        LogisticsStorage, // 3--物流仓库
        Storage, // 4--仓库
        Transfer, // 5--运输员
        Distributor // 6--分销商
    }

    // 产品信息结构体
    struct Product {
        uint id;
        string name;
        uint quantity;
        address currentOwner;
    }

    //运输信息结构体
    struct Shipment {
        uint shipmentId; //运输编号id
        uint productId; //产品id
        address origin; //发出地
        address destination; //目的地
        uint dateOfDeparture; //发件时间
        uint expectedArrivalDate; //预计到达时间
        uint quantity; //运输数量
        string status; //运输状态
    }

    // 用户信息结构体
    struct User {
        EntityType entityType; //用户的实体类型
        Role role; //用户的角色类型
    }

    address[] private users_list; //用户列表
    uint[] private product_list; //产品列表

    address public admin;
    uint public productCount;
    uint public shipmentCount; //运输数量

    mapping(uint => Product) private products; //产品信息
    mapping(uint => Shipment) private shipments; //产品运输信息
    mapping(address => User) private users; //用户信息

    // 事件定义
    event ProductAdded(uint product);
    event UserAdded(address user);
    event ProductDeleted(uint product);
    event UserDeleted(address user);
    event ShipmentAdded(uint shipment, address toDestination); //运输信息添加成功
    event ShipmentUpdated(uint shipment, string status);

    // 失败时抛出异常
    error UserNotAdded(string errorMessage, address user);
    error ProductNotDeleted(string errorMessage, uint product);
    error UserNotDeleted(string errorMessage, address user);
    error ShipmentNotAdded(
        string errorMessage,
        uint shipment,
        address toDestination
    );
    error ShipmentNotUpdated(string errorMessage, uint shipment); //运输信息更新失败
    error CannotTrackShipment(string errorMessage, uint productId); //无法追踪运输信息
    error NotFoundShipment(string errorMessage, uint productId); //无法找到运输信息

    // 权限控制
    modifier onlyAdmin() {
        require(users[msg.sender].role == Role.Administrator, "Not authorized");
        _;
    }

    modifier onlySupplier() {
        require(users[msg.sender].role == Role.Supplier, "Not authorized");
        _;
    }

    constructor() {
        admin = msg.sender;
        User memory adminUser = User(EntityType.None, Role.Administrator);
        users[admin] = adminUser;
        users_list.push(admin);
        productCount = 0;
        shipmentCount = 0;
    }

    // 检查用户是否存在
    function _userExists(address _adr) private view returns (bool) {
        for (uint256 i = 0; i < users_list.length; i++) {
            if (users_list[i] == _adr) {
                return true;
            }
        }
        return false;
    }

    // 添加用户
    function addUser(
        address user,
        uint entityType, //实体类型
        uint role //角色类型
    ) public onlyAdmin {
        User memory newUser = User(EntityType(entityType), Role(role));

        // 检查用户是否已存在
        if (_userExists(user) == true) {
            revert UserNotAdded("User already exists", user);
        }
        // 禁止添加管理员用户
        if (newUser.role == Role.Administrator) {
            revert UserNotAdded("Adding admin user is permitted", user);
        }

        // 检查实体类型和角色是否匹配，匹配则添加用户并触发event事件记录
        if (
            (newUser.role == Role.Supplier &&
                (newUser.entityType != EntityType.Supplier &&
                    newUser.entityType != EntityType.Transfer &&
                    newUser.entityType != EntityType.Constructor)) ||
            (newUser.role == Role.LogisticsEmployee &&
                (newUser.entityType != EntityType.LogisticsStorage &&
                    newUser.entityType != EntityType.Distributor)) ||
            (newUser.role == Role.Controller &&
                newUser.entityType != EntityType.Storage)
        ) {
            revert UserNotAdded(
                "Cannot create user with such combination of entity type and role. ",
                user
            );
        }
        users[user] = newUser;
        users_list.push(user);
        emit UserAdded(user);
    }

    // 删除用户
    function removeUser(address user) public onlyAdmin {
        if (user == admin) {
            revert UserNotDeleted("Cannot remove admin!", user);
        }
        uint length = users_list.length;
        for (uint i = 0; i < length; i++) {
            if (
                keccak256(abi.encodePacked(users_list[i])) ==
                keccak256(abi.encodePacked(user))
            ) {
                users_list[i] = users_list[length - 1];
                users_list.pop();
                delete users[user];
                emit UserDeleted(user);
                return;
            }
        }
        // 如果没有找到目标值i，则抛出异常
        revert UserNotDeleted("Cannot remove user!", user);
    }

    function getUser(address user) public view returns (uint, uint) {
        return (uint(users[user].role), uint(users[user].entityType));
    }

    function getUsers() public view returns (address[] memory) {
        return users_list;
    }

    // 上架新产品-仅供应商角色有权限
    function addProduct(string memory name, uint quantity) public onlySupplier {
        productCount++; //商品数量+1
        Product memory newProduct = Product(
            productCount,
            name,
            quantity,
            msg.sender
        );
        products[productCount] = newProduct;
        product_list.push(productCount);
        emit ProductAdded(newProduct.id);
    }

    //下架产品--仅管理员有权限
    function removeProduct(uint productId) public onlyAdmin {
        for (uint i = 0; i < productCount; i++) {
            if (product_list[i] == productId) {
                product_list[i] = product_list[productCount - 1];
                delete products[productId];
                product_list.pop();
                emit ProductDeleted(productId);
                return;
            }
        }
        revert ProductNotDeleted("Could not remove product", productId);
    }

    // 获取产品详情
    function getProduct(uint productId) public view returns (Product memory) {
        return products[productId];
    }

    // 获取所有产品列表
    function getProducts() public view returns (uint[] memory) {
        return product_list;
    }

    // 添加运输信息
    function addShipment(
        uint productId,
        address destination,
        uint expectedArrivalDate, // 预计到达时间
        string memory status, // 运输状态
        uint quantity
    ) public {
        if (
            uint(users[destination].entityType) ==
            uint(users[msg.sender].entityType) + 1 ||
            uint(users[destination].entityType) ==
            uint(users[msg.sender].entityType) - 1
        ) {
            // 检验产品库存是否足够
            if (products[productId].quantity >= quantity) {
                shipmentCount++;
                shipments[shipmentCount] = Shipment(
                    shipmentCount,
                    productId,
                    msg.sender,
                    destination,
                    block.timestamp,
                    expectedArrivalDate,
                    quantity,
                    status
                );
                products[productId].currentOwner = destination;
                emit ShipmentAdded(productId, destination);
            } else {
                revert ShipmentNotAdded(
                    "Not enough products",
                    productId,
                    destination
                );
            }
        } else {
            revert ShipmentNotAdded(
                "Can not send shipment to this user",
                productId,
                destination
            );
        }
    }

    //更新运输状态信息
    function updateShipment(uint shipmentId, string memory status) public {
        if (
            // 只有运输方任务的相关方才可以更新
            msg.sender != shipments[shipmentId].origin &&
            msg.sender != shipments[shipmentId].destination
        ) {
            revert ShipmentNotUpdated(
                "You must be the sender of the shipment.",
                shipmentId
            );
        }
        shipments[shipmentId].status = status;
        emit ShipmentUpdated(shipmentId, status);
    }

    // 获取运输信息
    function getShipment(
        uint shipmentId
    ) public view returns (Shipment memory) {
        require(
            users[msg.sender].role == Role.Controller ||
                shipments[shipmentId].origin == msg.sender ||
                shipments[shipmentId].destination == msg.sender,
            "Not authorized"
        );
        return shipments[shipmentId];
    }

    // 跟踪产品的运输信息
    function trackProduct(
        uint productId
    ) public view returns (Shipment[] memory) {
        // 根据用户的角色返回不同的运输信息
        if (users[msg.sender].role == Role.Supplier) {
            Shipment[] memory productShipments = _productShipments(
                productId,
                EntityType.Constructor
            );
            return productShipments;
        } else if (users[msg.sender].role == Role.LogisticsEmployee) {
            Shipment[] memory productShipments = _productShipments(
                productId,
                EntityType.LogisticsStorage
            );
            return productShipments;
        } else if (users[msg.sender].role == Role.Controller) {
            Shipment[] memory productShipments = _productShipments(
                productId,
                EntityType.Storage
            );
            return productShipments;
        } else {
            revert("Something bad happened");
        }
    }

    //检查当前用户是否为运输参与者
    function _isShipmentParticipant(
        Shipment memory shipment,
        EntityType entityType
    ) private view returns (bool) {
        return
            users[shipment.destination].entityType <= entityType ||
            msg.sender == shipment.origin ||
            msg.sender == shipment.destination;
    }

    // 获取特定产品相关的运输单列表
    function _productShipments(
        uint productId,
        EntityType entityType
    ) private view returns (Shipment[] memory) {
        uint count = 0;
        for (uint i = 1; i <= shipmentCount; i++) {
            if (shipments[i].productId == productId) {
                if (_isShipmentParticipant(shipments[i], entityType)) {
                    count++;
                } else {
                    revert CannotTrackShipment(
                        "No permission to view the current shipment history",
                        productId
                    );
                }
            }
        }

        if (count == 0) {
            revert NotFoundShipment(
                "No shipment found for this product id",
                productId
            );
        }

        Shipment[] memory productShipments = new Shipment[](count);
        uint index = 0;
        for (uint i = 1; i <= shipmentCount; i++) {
            if (shipments[i].productId == productId) {
                if (_isShipmentParticipant(shipments[i], entityType)) {
                    productShipments[index] = shipments[i];
                    index++;
                } else {
                    break;
                }
            }
        }

        return productShipments;
    }
}
